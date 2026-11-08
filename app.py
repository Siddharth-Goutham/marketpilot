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
    return render_template('index.html')

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
            return redirect(url_for("dashboard"))

    return render_template("auth.html")


@app.route('/logout')
def logout():
    session.pop("user_id", None)
    return redirect(url_for("login"))


@app.route("/dashboard")
def dashboard():
    return render_template('index.html')


@app.route("/watchlist")
def watchlist():
    return render_template('watchlist.html')


@app.route("/market_stories")
def market_stories():

    return render_template('market-stories.html')




if __name__=="__main__":
    app.run(debug=True)