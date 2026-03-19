import logging
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
from app.schemas import (
    EventIngestRequest,
    EventResponse,
    EventSummary,
    LLMEventResponse,
    NextActionResponse,
    NextActionSuggestion,
)

# Configure logging to DEBUG level
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


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
  "name": "A short descriptive name for this event based on its content (e.g., 'Time management coaching', 'Team priorities discussion', 'Stakeholder communication planning')",
  "takeaway": "A short, strong second-person learning for the user that captures what they realized or learned in this interaction (e.g., 'You learned that protecting focus time matters more than staying constantly available.', 'You learned that leading with the decision makes your message more credible.')",
  "analysis": "Short synthesis written in second person (addressing 'you') explaining what the user demonstrated in this session and what evidence supports the detected competencies. Example: 'In this session, you focused on improving time management by...'",
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
6. Write a short takeaway that distills the most important message for the user from this interaction.
7. Use today's processing date if a date is available in context. Otherwise use the provided processing date.

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
- Be written in second person, directly addressing the user as "you" in a natural, conversational tone.
- Vary your opening phrases. Don't always start with "In this session". Use natural variations like:
  * "You focused on..."
  * "This conversation centered on..."
  * "You demonstrated..."
  * "The main theme here was..."
  * "You worked on..."
  * "Your primary focus was..."
- Be concise (2-4 sentences).
- Explain which competencies the user demonstrated most strongly and why.
- Reference specific evidence from the text showing what the user said or did.
- Avoid vague or generic statements.
- If no evidence exists, state that clearly while still addressing the user directly in a natural way.

TAKEAWAY REQUIREMENTS

The "takeaway" field must:
- Be written as a learning the user gained from this specific interaction.
- Always be phrased in second person, directly addressing the user.
- Be short: 1 sentence, ideally 6-12 words.
- State the clearest lesson, realization, or shift that emerged for the user in the interaction.
- Be specific to the event text, not generic coaching advice.
- Avoid imperative phrasing like direct commands unless the event itself clearly frames the learning that way.
- Avoid sounding templated or hardcoded; vary the wording naturally while keeping the same intention.
- It is good to use patterns like "You learned that...", "You realized that...", or "You saw that..." when they fit naturally.
- If helpful, briefly anchor the learning in the user's actions or commitments from the event.
- Avoid explanation, hedging, filler, or multiple ideas joined together.
- Sound memorable and personally meaningful to the user.

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
{event_text}

PROCESSING_DATE
{processing_date}"""


NEXT_ACTION_PROMPT = """You are a coaching assistant helping suggest the next conversation topic with Ally, an AI coaching companion.

Based on the user's coaching journey from the last 3 months, identify the most important learnings that are emerging for them and suggest the next small action they should explore with Ally to turn those learnings into practice.

The suggestion should:
- Be written in second person, directly addressing the user (e.g., "You can talk to Ally about...")
- Feel natural and conversational
- Use Markdown to highlight the most important parts of the message
- Be grounded in the patterns, themes, and learnings visible across the last 3 months of events
- Open by describing the user's trajectory and emerging learnings across the events before suggesting any next step
- Make that trajectory-and-learning opening mandatory, not optional
- Open with a bold, high-impact statement about the user's trajectory so far
- Focus on one clear theme or challenge that would help them grow
- Recommend one small next action, experiment, or behavior shift the user can take next
- Connect that action to what the user appears to be learning about themselves
- Be specific enough to be actionable, but small enough to feel doable
- Explicitly reference one or more of the events provided in the summary when explaining why this is the right next step
- Always include at least one explicit reference to the most recent event in the suggestion text
- Vary your opening phrases naturally
- Avoid generic encouragement or broad coaching topics

DECISION RULES

- Read the full 3-month history as a progression, not as isolated events.
- Pay close attention to repeated takeaways, recurring competencies, and patterns in the analyses.
- Infer the user's current learning edge: what they are beginning to understand, practice, or struggle to sustain.
- First summarize the trajectory: how the user's recent events show movement, repetition, or progression in their learning.
- Choose the next small action that most directly helps the user deepen or apply that learning.
- Prefer a concrete behavior for the next conversation over a broad area of reflection.
- If multiple themes appear, choose the one that seems most actionable now.
- When referring to prior events, use concrete anchors already present in the summary such as event date, event type, or takeaway.
- The most recent event is mandatory evidence and must be referenced directly by date, type, takeaway, or a clear combination of those.

RESPONSE STRUCTURE

- Sentence 1 must describe the user's trajectory and the main learning(s) emerging across the recent events.
- Sentence 1 must begin with Markdown bold and present the trajectory insight as the most impactful observation so far.
- Sentence 2 should suggest the next small action to explore with Ally.
- Do not start directly with the recommendation.
- Use Markdown emphasis sparingly and intentionally, highlighting only the most important trajectory insight, learning, or next action.
- Across the full suggestion, include an explicit reference to the most recent event.

RECENT EVENTS SUMMARY:
{events_summary}

Return exactly one JSON object with:
- suggestion: A natural, conversational suggestion (1-2 sentences)
- related_competencies: List of 1-3 competency names most relevant to this suggestion

Example output:
{{
  "suggestion": "You can talk to Ally about managing stakeholder expectations, especially when priorities shift unexpectedly. This could help you build on your recent work with communication and influence.",
  "related_competencies": ["Communicating Effectively and Influencing Stakeholders", "Developing Leadership Presence"]
}}"""


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
    # Convert CompetencySignals to dict for storage and override name with event_type
    result_dict = llm_result.model_dump(by_alias=True)
    result_dict["name"] = payload.event_type
    event = models.Event(user_id=payload.user_id, **result_dict)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@app.get("/api/users/{user_id}/next-action", response_model=NextActionResponse)
async def get_next_action(
    user_id: str,
    db: Session = Depends(get_db),
    llm: AbstractLLM = Depends(get_llm),
):
    """
    Generate a personalized suggestion for the next Ally conversation
    based on the user's last 3 months of events.
    """
    three_months_ago = date.today().replace(day=1)
    if three_months_ago.month <= 3:
        three_months_ago = three_months_ago.replace(
            year=three_months_ago.year - 1,
            month=three_months_ago.month + 9,
        )
    else:
        three_months_ago = three_months_ago.replace(month=three_months_ago.month - 3)

    # Fetch events from the last 3 months for the user, ordered by date descending
    recent_events = (
        db.query(models.Event)
        .filter(models.Event.user_id == user_id)
        .filter(models.Event.date >= three_months_ago)
        .order_by(models.Event.date.desc())
        .all()
    )
    
    # If no events, return a default suggestion
    if not recent_events:
        return NextActionResponse(
            suggestion="Start your journey by talking to Ally about your current leadership challenges and what you'd like to focus on.",
            related_competencies=["Improving Time Management, Organization, and Productivity"],
            based_on_events=[]
        )
    
    # Format events summary for the LLM prompt
    events_summary_parts = []
    for idx, event in enumerate(recent_events, 1):
        # Get top 2 competencies from signals
        signals = event.signals if isinstance(event.signals, dict) else {}
        top_competencies = sorted(
            [(k, v) for k, v in signals.items() if v > 0],
            key=lambda x: x[1],
            reverse=True
        )[:2]
        
        competencies_str = ", ".join([f"{comp} ({val:.1f}%)" for comp, val in top_competencies])
        
        events_summary_parts.append(
            f"Event {idx} ({event.date}):\n"
            f"  Type: {event.name}\n"
            f"  Takeaway: {event.takeaway}\n"
            f"  Analysis: {event.analysis[:200]}...\n"
            f"  Top competencies: {competencies_str if competencies_str else 'None detected'}"
        )
    
    events_summary = "\n\n".join(events_summary_parts)
    
    # Call LLM to generate suggestion
    async with llm:
        suggestion_result: NextActionSuggestion = await llm.run_simple_completion(
            system_prompt=NEXT_ACTION_PROMPT,
            dto_class=NextActionSuggestion,
            data={"events_summary": events_summary},
        )
    
    # Build response with event summaries
    event_summaries = [
        EventSummary(id=event.id, name=event.name, date=event.date)
        for event in recent_events
    ]
    
    return NextActionResponse(
        suggestion=suggestion_result.suggestion,
        related_competencies=suggestion_result.related_competencies,
        based_on_events=event_summaries
    )
