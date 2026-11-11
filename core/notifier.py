import os
import smtplib
from dotenv import load_dotenv
from email.message import EmailMessage
from app import app
from model import User,NewsCache,Watchlist

load_dotenv()
email_list=[]
ticker_list=[]
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

with app.app_context():
    users = User.query.all()

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(
            SENDER_EMAIL,
            SENDER_PASSWORD
        )

        for user in users:
            watchlist_items = Watchlist.query.filter_by(user_id=user.id).all()
            if not watchlist_items:
                continue

            email_body = f"Greetings {user.username if hasattr(user, 'username') else ''},\n\nToday's Market Stories!!\n\n"
            has_news = False

            for item in watchlist_items:
                news_articles = NewsCache.query.filter_by(ticker=item.ticker).all()
                if news_articles:
                    has_news = True
                    email_body += f"=== {item.ticker} ===\n"
                    for article in news_articles:
                        email_body += (
                            f"News: {article.title}\n"
                            f"Date: {article.publised_date}, {article.published_time}\n"
                            f"Link: {article.link}\n\n"
                        )
                    email_body+=("\n")
            email_body+=("Have a great TRADE!!")

            if has_news:
                msg = EmailMessage()
                msg["Subject"] = "Market stories from MarketPilot"
                msg["From"] = SENDER_EMAIL
                msg["To"] = user.email
                msg.set_content(email_body)

                server.send_message(msg)






