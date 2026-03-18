import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aceup.db")

_engine_kwargs: dict = {"connect_args": {"check_same_thread": False}}

# SQLite in-memory databases need StaticPool to keep a single connection alive
# so that all sessions see the same data (especially important during tests
# and when the lifespan and request handlers share the same in-memory DB).
if SQLALCHEMY_DATABASE_URL == "sqlite:///:memory:":
    from sqlalchemy.pool import StaticPool
    _engine_kwargs["poolclass"] = StaticPool

engine = create_engine(SQLALCHEMY_DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
