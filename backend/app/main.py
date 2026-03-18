import os
from contextlib import asynccontextmanager
from datetime import date
from typing import List

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import models
from app.adapters.gemini_adapter import GeminiAdapter
from app.database import engine, get_db
from app.ports.llm import AbstractLLM
from app.schemas import EventIngestRequest, EventResponse, LLMEventResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    from app.seed import seed_database
    from app.database import SessionLocal
    # Respect dependency overrides so tests can inject a mock LLM (no real API calls)
    llm_factory = app.dependency_overrides.get(get_llm, get_llm)
    db = SessionLocal()
    try:
        await seed_database(db, llm_factory, SIGNAL_EXTRACTION_PROMPT)
    finally:
        db.close()
    yield


app = FastAPI(title="AceUp Hackathon API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SIGNAL_EXTRACTION_PROMPT = """You are an organizational behavior signal extractor.

Your job is to read unstructured event text such as coaching transcripts, team discussions, workshop notes, meeting recaps, or similar workplace conversations, and convert the content into a normalized signal summary across a fixed competency model.

You must identify evidence of micro-behaviors in the text, map each micro-behavior to its parent competency, count the number of supported micro-behavior appearances, normalize the competency signals so they sum to 100%, and explain the reasoning briefly and clearly.

Return exactly one JSON object and nothing else.

OUTPUT FORMAT

{{
  "name": "Intake debrief",
  "analysis": "Short synthesis explaining why the strongest competencies were detected and what evidence supports them.",
  "signals": {{
    "Improving Time Management, Organization, and Productivity": 0,
    "Developing Leadership Presence": 0,
    "Transitioning from Subject Matter Expert to Leadership": 0,
    "Communicating Effectively and Influencing Stakeholders": 0,
    "Growing Emotional Intelligence": 0,
    "Managing Conflicts and Difficult Conversations": 0,
    "Regulating Stress and Building Resilience": 0,
    "Leading with a Growth Mindset": 0,
    "Facilitating Effective Change Management": 0,
    "Collaborating Across The Organization": 0,
    "Developing a Coaching Approach to Management": 0,
    "Building and Leading Inclusive Teams": 0
  }},
  "date": "YYYY-MM-DD"
}}

CORE TASK

1. Read the input text carefully.
2. Detect whether any of the defined micro-behaviors are evidenced in the text.
3. Each time a micro-behavior is clearly evidenced, assign one point to its parent competency.
4. After scoring all competencies, normalize the totals into percentages so that all competency values sum to 100%.
5. Write a short analysis summarizing the strongest and weakest signals using only evidence grounded in the text.
6. Use today's processing date if a date is available in context. Otherwise use the provided processing date.

IMPORTANT SCORING RULES

- Score only from textual evidence in the input.
- Do not infer a micro-behavior unless the text provides meaningful support.
- A micro-behavior can be counted when it is:
  - explicitly demonstrated,
  - clearly described as an intended behavior, commitment, agreement, or repeated pattern,
  - or strongly implied by concrete language in the event text.
- Count one point per micro-behavior appearance.
- If the same exact idea is repeated many times without adding a new instance, avoid inflating the score.
- If multiple different passages independently support the same micro-behavior, you may count multiple appearances, but be conservative.
- If the text is weak, ambiguous, or contradictory, do not award the point.
- Ignore personally identifiable information. Emails, phone numbers, addresses, IDs, company names, and personal identifiers are never signals.
- Ignore generic emotional language unless it supports a defined micro-behavior.
- Do not score based on who said it. Score based on whether the behavior is present in the text.
- If no competency has evidence, return all signals as 0 and explain that evidence was insufficient.

NORMALIZATION

- Let each competency total be the number of matched micro-behavior appearances for that competency.
- Let total_points be the sum across all competencies.
- If total_points > 0, compute:
  normalized_signal = (competency_points / total_points) * 100
- Round to at most 4 decimal places.
- Ensure the final normalized values sum to 100, allowing only minor rounding variance.
- If total_points = 0, all values must be 0.

ANALYSIS REQUIREMENTS

The "analysis" field must:
- be concise but specific,
- describe the strongest signals first,
- mention why those signals appeared,
- mention lower-signal or absent competencies when meaningful,
- refer to concrete themes from the text,
- not quote long passages,
- not mention hidden reasoning or internal scoring mechanics.

COMPETENCY MODEL

Competency: Improving Time Management, Organization, and Productivity
Micro-behaviors:
- Planning & prioritizing effectively
- Helping others prioritize in order to achieve the most important targets
- Allotting time to recharge
- Planning time to focus on high-value work

Competency: Developing Leadership Presence
Micro-behaviors:
- Adapting behavior to changing circumstances for optimal team performance
- Employing stories to motivate and persuade stakeholders
- Addressing the concerns of my audience in communications
- Leading assertively, especially in times of uncertainty and change

Competency: Transitioning from Subject Matter Expert to Leadership
Micro-behaviors:
- Spending less time on tasks and more time on strategy
- Providing opportunities to help others grow and develop
- Helping others find solutions on their own rather than telling them
- Delegating more effectively and often

Competency: Communicating Effectively and Influencing Stakeholders
Micro-behaviors:
- Addressing stakeholders' concerns in important communications
- Engaging with stakeholders before and after major meetings/presentations
- Keeping stakeholders engaged and motivated to action
- Maintaining composure in critical situations

Competency: Growing Emotional Intelligence
Micro-behaviors:
- Being aware of team members' emotions and how to better manage them
- Mastering their own emotions while under stress and pressure
- Listening with empathy and being aware of the emotional cues of others
- Leading in ways that increase the range of voices and issues that are heard

Competency: Managing Conflicts and Difficult Conversations
Micro-behaviors:
- Putting oneself in the right state of mind to move through difficult communication effectively
- Helping others work through conflicts and complex situations constructively
- Helping others resolve conflicts or disagreement
- Expressing and hearing disagreement with the intent to move toward deeper understanding

Competency: Regulating Stress and Building Resilience
Micro-behaviors:
- Identifying strategies for regaining balance and clear thinking
- Identifying and managing the impact of limiting beliefs
- Recognizing and interrupting stress triggers
- Helping others better manage stress and become more resilient

Competency: Leading with a Growth Mindset
Micro-behaviors:
- Stepping outside the comfort zone and trying new skills and approaches in order to test and learn
- Shifting from transmitting knowledge to fostering curiosity and appropriate risk-taking
- Treating failure as a learning opportunity
- Inspiring individuals to focus on progress rather than perfection

Competency: Facilitating Effective Change Management
Micro-behaviors:
- Exploring new strategies to improve the roll-out of the change
- Leading with a shared why; increasing engagement and consensus
- Encouraging others to share thoughts and concerns regarding important changes
- Communicating consistently and transparently to stakeholders

Competency: Collaborating Across The Organization
Micro-behaviors:
- Actively seeking ways to collaborate
- Ensuring a clear line of sight between individual and organizational goals
- Seeking and incorporating others' input to improve ideas
- Collaborating rather than competing with peers to achieve organizational success

Competency: Developing a Coaching Approach to Management
Micro-behaviors:
- Helping team members create their own innovative solutions
- Shifting from having to "do it myself" to delegation
- Engaging in more frequent and growth-focused feedback with others
- Increasing clarity of expectations and roles to increase buy-in

Competency: Building and Leading Inclusive Teams
Micro-behaviors:
- Helping team members work together effectively
- Holding team members accountable for behavior that affects others
- Helping individuals understand how their work fits into larger goals of the team
- Empowering the team to use our diverse perspectives to perform better

DECISION GUIDANCE

Use these interpretations consistently:
- Agreements, commitments, and action plans can count as evidence if they clearly express a micro-behavior.
- Repeated team patterns can count if the text shows the behavior is actually being practiced or intentionally adopted.
- Complaints about the absence of a behavior do not count as evidence of that behavior.
- Discussions of process design may count if the process clearly operationalizes a micro-behavior.
- Generic collaboration language is not enough on its own. Look for specificity.
- Generic stress or frustration is not enough on its own. Look for regulation, reframing, recovery, or resilience behavior.
- Generic leadership language is not enough on its own. Look for observable behavior tied to the competency model.

QUALITY BAR

Be conservative, text-grounded, and repeatable.
Do not optimize for sounding impressive.
Optimize for consistency, traceability, and reliability across varied workplace event text.

INPUT
{{event_text}}

PROCESSING_DATE
{{processing_date}}"""


def get_llm() -> AbstractLLM:
    return GeminiAdapter(api_key=os.environ["GEMINI_API_KEY"])


@app.get("/api/hello")
def hello():
    return {"message": "Hello from AceUp Hackathon!"}


@app.get("/api/users/{user_id}/history", response_model=List[EventResponse])
def get_user_history(user_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.Event)
        .filter(models.Event.user_id == user_id)
        .order_by(models.Event.date.desc())
        .all()
    )


@app.post("/api/events", response_model=EventResponse, status_code=201)
async def create_event(
    payload: EventIngestRequest,
    db: Session = Depends(get_db),
    llm: AbstractLLM = Depends(get_llm),
):
    async with llm:
        llm_result: LLMEventResponse = await llm.run_simple_completion(
            system_prompt=SIGNAL_EXTRACTION_PROMPT,
            dto_class=LLMEventResponse,
            data={
                "event_text": payload.event_text,
                "processing_date": str(date.today()),
            },
        )
    event = models.Event(user_id=payload.user_id, **llm_result.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
