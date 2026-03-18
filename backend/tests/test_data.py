from app.seed import (  # noqa: F401 — re-exported for test convenience
    ALLY_CHAT_CONVERSATIONS,
    COMPLEX_TEAM_TRANSCRIPTS,
    TRANSCRIPTS,
    format_chat,
)

MOCK_LLM_RESPONSE = {
    "name": "Intake debrief",
    "analysis": (
        "The strongest signal is Collaborating Across The Organization because all four related "
        "micro-behaviors appear as positive signals: actively seeking collaboration, keeping a clear "
        "line of sight to organizational goals, seeking others' input, and collaborating rather than "
        "competing. Strong secondary signals appear in Growing Emotional Intelligence, Leading with a "
        "Growth Mindset, and Building and Leading Inclusive Teams, with repeated evidence of empathy, "
        "emotional awareness, learning orientation, and inclusion of diverse perspectives. Communicating "
        "Effectively and Influencing Stakeholders, Managing Conflicts and Difficult Conversations, and "
        "Facilitating Effective Change Management show moderate signal, suggesting capability is present "
        "but not yet fully consistent. Lower-signal areas are Improving Time Management, Organization, "
        "and Productivity, Developing Leadership Presence, Transitioning from Subject Matter Expert to "
        "Leadership, Regulating Stress and Building Resilience, and Developing a Coaching Approach to "
        "Management, which aligns with the respondent's stated desire to improve focus, confidence, "
        "delegation, and handling difficult situations."
    ),
    "signals": {
        "Improving Time Management, Organization, and Productivity": 4.1667,
        "Developing Leadership Presence": 4.1667,
        "Transitioning from Subject Matter Expert to Leadership": 4.1667,
        "Communicating Effectively and Influencing Stakeholders": 8.3333,
        "Growing Emotional Intelligence": 12.5,
        "Managing Conflicts and Difficult Conversations": 8.3333,
        "Regulating Stress and Building Resilience": 4.1667,
        "Leading with a Growth Mindset": 12.5,
        "Facilitating Effective Change Management": 8.3333,
        "Collaborating Across The Organization": 16.6667,
        "Developing a Coaching Approach to Management": 4.1667,
        "Building and Leading Inclusive Teams": 12.5,
    },
    "date": "2026-03-18",
}
