from flask import Flask, render_template, session, request, redirect, url_for, flash
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime


from model import db, User, Watchlist, NewsCache

app=Flask(__name__)

app.config['SECRET_KEY'] = 'super_secret_hackathon_key'
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///marketpilot.db"

db.init_app(app)


with app.app_context():
    db.create_all()

@app.route("/")
def landing_page():
    return render_template('auth.html')

@app.route("/auth", methods=["GET", "POST"])
def auth():
    if request.method == "POST":
        action = request.form.get("action")
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "").strip()

        if action == "login":
            user = User.query.filter_by(email=email).first()
            if user and check_password_hash(user.password, password):
                session["user_id"] = user.id
                return redirect(url_for("dashboard"))
            else:
                flash("Invalid email or password.")
                return redirect(url_for("auth"))

        # 2. Handled when user submits the "Create account" form
        elif action == "signup":
            username = request.form.get("username", "").strip()

            existing_user = User.query.filter(
                (User.email == email) | (User.username == username)
            ).first()

            if existing_user:
                flash("Account with this email or username already exists.")
                return redirect(url_for("auth"))

            new_user = User(
                username=username,
                email=email,
                password=generate_password_hash(password),
                token_date=datetime.now(),
                subscription_tier='Nidhi'
            )
            db.session.add(new_user)
            db.session.commit()

            session["user_id"] = new_user.id
            return redirect(url_for("dashboard",session=session['user_id']))

    return render_template("auth.html")


@app.route('/logout')
def logout():
    session.pop("user_id", None)
    return redirect(url_for("auth"))


@app.route("/dashboard")
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for("auth"))

    users = User.query.filter_by(id=session['user_id']).first()
    display_name = users.username.split()[0] if users else "Trader"

    now_hour=float(datetime.now().hour)
    if now_hour<12:
        parts_of_day="morning"
    elif 12 <= now_hour < 17:
        parts_of_day = "afternoon"
    else:
        parts_of_day = "evening"

    tickers_list=Watchlist.query.filter_by(user_id=session['user_id']).all()

    return render_template('index.html',user=display_name,users=users,parts_of_day=parts_of_day,tickers_list=tickers_list)


@app.route("/watchlist",methods=['POST','GET'])
def watchlist():
    if 'user_id' not in session:
        return redirect(url_for('auth'))
    users = User.query.filter_by(id=session['user_id']).first()
    if request.method == 'POST':
        company=request.form.get('company_name')
        if company:
            new_ticker=Watchlist(
            user_id=session['user_id'],
            ticker=company,
            auto_execute=0
            )
            db.session.add(new_ticker)
            db.session.commit()
            return redirect(url_for('watchlist'),users=users)

    tickers_list=Watchlist.query.filter_by(user_id=session['user_id']).all()
    return render_template('watchlist.html',tickers_list=tickers_list,users=users)

@app.route('/watchlist/delete/<ticker>',methods=['POST'])
def delete_stock(ticker):
    if 'user_id' not in session:
        return redirect(url_for('auth'))

    Watchlist.query.filter_by(user_id=session['user_id'], ticker=ticker).delete()
    db.session.commit()
    return redirect(url_for('watchlist'))


@app.route("/market_stories")
def market_stories():
    users = User.query.filter_by(id=session['user_id']).first()
    return render_template('market-stories.html',users=users)

@app.route("/pricing")
def pricing():
    users = User.query.filter_by(id=session['user_id']).first()
    return render_template('pricing.html',users=users)

@app.route('/broker_connection')
def broker_connection():
    users = User.query.filter_by(id=session['user_id']).first()
    return render_template('broker-connection.html',users=users)


@app.route('/profile/<int:user_id>', methods=['POST', 'GET'])
def profile(user_id):
    # 1. Protection check: Ensure the user is logged in
    if 'user_id' not in session:
        return redirect(url_for('auth'))

    # 2. Security check: Prevent logged-in user A from modifying user B's profile via the URL
    if session['user_id'] != user_id:
        return "Unauthorized action", 403

    # 3. Fetch single record (renamed variable to 'user' for clarity)
    user = User.query.get_or_404(user_id)

    if request.method == "POST":
        # 4. Grab form inputs
        new_email = request.form.get('email')
        new_username = request.form.get('username')

        # 5. Basic Validation: Ensure fields aren't completely blank or null
        if not new_email or not new_username:
            return "Email and Username cannot be empty!", 400

        # 6. Apply updates and commit
        user.email = new_email
        user.username = new_username
        db.session.commit()

        # 7. Post-Update Action: Typically best to redirect back or flash a message
        return redirect(url_for('profile', user_id=user_id))

    # For GET requests, render the page
    return render_template('profile.html', users=user)


if __name__=="__main__":
    app.run(debug=True)