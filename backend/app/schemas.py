from datetime import date

from pydantic import BaseModel


class EventIngestRequest(BaseModel):
    user_id: str
    event_text: str


class LLMEventResponse(BaseModel):
    name: str
    analysis: str
    signals: dict[str, float]
    date: date


class EventResponse(BaseModel):
    id: int
    name: str
    analysis: str
    signals: dict[str, float]
    date: date

    model_config = {"from_attributes": True}
