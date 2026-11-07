import requests
import sys
from app import app
from pathlib import Path
from model import Watchlist,NewsCache,db
from sqlalchemy import select
import os
from dotenv import load_dotenv

load_dotenv()
sys.path.append(str(Path(__file__).resolve().parent.parent))

ticker_list=[]
ticker_dict={}
URL="https://gnews.io/api/v4/search"
API_KEY=os.getenv("GNEWS_API_KEY")

def get_unique_ticker_from_watchlist():
    tickers = db.session.scalars(select(Watchlist.ticker).distinct()).all()
    return [ticker for ticker in tickers if ticker]


def get_news(tickerr):
        params = {
        "q": tickerr,
        "lang": "en",
        "country": "in",
        "max": 10,
        "sortby": "publishedAt",
        "apikey": API_KEY
        }

        response = requests.get(
            URL,
            params=params,
            timeout=10
        )

        response.raise_for_status()
        ticker_dict[tickerr] = []

        for article in response.json()["articles"]:
            ticker_dict[tickerr].append({
                'title': article["title"],
                'published_date': article["publishedAt"],
                'url': article["url"]
            })

def update_database(target_ticker,articles_list):
    NewsCache.query.filter_by(ticker=target_ticker).delete()

    try:
        for news in articles_list:
            new_cache_entry = NewsCache(
            ticker=target_ticker,
            title=news['title'],
            link=news['url'],
            scraped_at=news['published_date']
        )
            db.session.add(new_cache_entry)

        db.session.commit()
        return True

    except Exception as e:
        db.session.rollback()
        print(f"[Error] Failed to update DB for {target_ticker}: {e}")
        return False


with app.app_context():
    ticker_list=get_unique_ticker_from_watchlist()
    for ticker in ticker_list:
        get_news(ticker)
        update_database(ticker,ticker_dict[ticker])
