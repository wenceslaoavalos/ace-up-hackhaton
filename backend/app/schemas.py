from datetime import date
from typing import List

from pydantic import BaseModel, Field


class CompetencySignals(BaseModel):
    """Fixed competency model signals."""
    improving_time_management: float = Field(alias="Improving Time Management, Organization, and Productivity")
    developing_leadership_presence: float = Field(alias="Developing Leadership Presence")
    transitioning_sme_to_leadership: float = Field(alias="Transitioning from Subject Matter Expert to Leadership")
    communicating_effectively: float = Field(alias="Communicating Effectively and Influencing Stakeholders")
    growing_emotional_intelligence: float = Field(alias="Growing Emotional Intelligence")
    managing_conflicts: float = Field(alias="Managing Conflicts and Difficult Conversations")
    regulating_stress: float = Field(alias="Regulating Stress and Building Resilience")
    leading_growth_mindset: float = Field(alias="Leading with a Growth Mindset")
    facilitating_change: float = Field(alias="Facilitating Effective Change Management")
    collaborating_across_org: float = Field(alias="Collaborating Across The Organization")
    coaching_approach: float = Field(alias="Developing a Coaching Approach to Management")
    building_inclusive_teams: float = Field(alias="Building and Leading Inclusive Teams")

    model_config = {"populate_by_name": True}


class EventIngestRequest(BaseModel):
    user_id: str
    event_text: str
    event_type: str  # intake_survey, 1_o_1, team_coaching, or ally_conversation


class LLMEventResponse(BaseModel):
    name: str
    analysis: str
    signals: CompetencySignals
    date: date


class EventResponse(BaseModel):
    id: int
    name: str
    analysis: str
    signals: dict[str, float]
    date: date

    model_config = {"from_attributes": True}


class EventSummary(BaseModel):
    id: int
    name: str
    date: date


class NextActionSuggestion(BaseModel):
    suggestion: str
    related_competencies: List[str]


class NextActionResponse(BaseModel):
    suggestion: str
    related_competencies: List[str]
    based_on_events: List[EventSummary]
