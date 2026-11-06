from flask import Flask
from model import db, User, Watchlist, NewsCache

app=Flask(__name__)

app.config['SECRET_KEY'] = 'super_secret_hackathon_key'
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///marketpilot.db"

db.init_app(app)


with app.app_context():
    db.create_all()
@app.route("/")
def home():
    return "Hello"

if __name__=="__main__":
    app.run(debug=True)