from sqlalchemy import Column, Integer, String, Text, JSON, Date

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    analysis = Column(Text, nullable=False)
    signals = Column(JSON, nullable=False)
    date = Column(Date, nullable=False)
