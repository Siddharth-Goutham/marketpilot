from flask_sqlalchemy import SQLAlchemy
from datetime import datetime,time

db = SQLAlchemy()

class User(db.Model):
    __tablename__='users'

    id=db.Column(
        db.Integer,
        primary_key=True
    )

    username=db.Column(
        db.String(50),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

    # is_active = db.Column(
    #     db.Boolean,
    #     default=True
    # )

    zerodha_access_token=db.Column(
        db.String(255),
        nullable=True
    )

    token_date = db.Column(
        db.String(10),
        nullable=True
    )

    subscription_tier = db.Column(
        db.String(20),
        nullable=False
    )


    watchlists = db.relationship(
        'Watchlist',
        back_populates='user',
        lazy='select')

class Watchlist(db.Model):
    __tablename__ = 'watchlist'

    __table_args__ = (
        db.UniqueConstraint(
            'user_id',
            'ticker',
            name='unique_user_ticker'
        ),
    )

    id=db.Column(
            db.Integer,
            primary_key=True
    )

    user_id=db.Column(
            db.Integer,
            db.ForeignKey('users.id'),
            nullable=False
    )

    ticker=db.Column(
                db.String(20),
    )

    auto_execute = db.Column(
        db.Boolean,
        default=False
    )

    gtt_trigger_price=db.Column(
            db.Numeric(12, 2),
            nullable=True
    )

    gtt_quantity=db.Column(
            db.Integer,
            nullable=True
    )

    user = db.relationship(
        'User',
        back_populates='watchlists'
    )

class NewsCache(db.Model):
            __tablename__ = 'news_cache'

            id=db.Column(
                db.Integer,
                nullable=False,
                primary_key=True
            )

            ticker=db.Column(
                db.String(20),
                nullable=False,
                index = True
            )

            title=db.Column(
                db.String(500),
                nullable=False
            )

            link=db.Column(
                db.String(500),
                nullable=False
            )

            sentiment_score = db.Column(
                db.Float,
                nullable=True
            )

            sentiment_label = db.Column(
                db.String(20),
                nullable=True
            )

            scraped_at = db.Column(
                db.String(20),
                nullable=False
            )
