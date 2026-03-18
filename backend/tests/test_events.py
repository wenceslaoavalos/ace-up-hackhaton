from tests.test_data import (
    ALLY_CHAT_CONVERSATIONS,
    COMPLEX_TEAM_TRANSCRIPTS,
    MOCK_LLM_RESPONSE,
    TRANSCRIPTS,
    format_chat,
)

USER_ID = "test-user-001"


def post_event(client, event_text: str):
    return client.post("/api/events", json={"user_id": USER_ID, "event_text": event_text})


# --- POST /api/events ---

def test_create_event_from_transcript(client):
    resp = post_event(client, TRANSCRIPTS[0])
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == MOCK_LLM_RESPONSE["name"]
    assert body["analysis"] == MOCK_LLM_RESPONSE["analysis"]
    assert body["signals"] == MOCK_LLM_RESPONSE["signals"]
    assert "user_id" not in body
    assert "id" in body


def test_create_event_from_team_transcript(client):
    resp = post_event(client, COMPLEX_TEAM_TRANSCRIPTS[0])
    assert resp.status_code == 201
    assert "id" in resp.json()


def test_create_event_from_chat(client):
    text = format_chat(ALLY_CHAT_CONVERSATIONS[0])
    resp = post_event(client, text)
    assert resp.status_code == 201
    assert "id" in resp.json()


def test_create_event_missing_event_text(client):
    resp = client.post("/api/events", json={"user_id": USER_ID})
    assert resp.status_code == 422


def test_create_event_missing_user_id(client):
    resp = client.post("/api/events", json={"event_text": TRANSCRIPTS[0]})
    assert resp.status_code == 422


def test_create_event_response_never_contains_user_id(client):
    for transcript in TRANSCRIPTS[:3]:
        body = post_event(client, transcript).json()
        assert "user_id" not in body


# --- GET /api/users/{user_id}/history ---

def test_get_history_empty_for_unknown_user(client):
    resp = client.get("/api/users/nonexistent-user/history")
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_history_returns_all_events_for_user(client):
    post_event(client, TRANSCRIPTS[0])
    post_event(client, format_chat(ALLY_CHAT_CONVERSATIONS[0]))

    resp = client.get(f"/api/users/{USER_ID}/history")
    assert resp.status_code == 200
    events = resp.json()
    assert len(events) == 2
    for event in events:
        assert "user_id" not in event
        assert "signals" in event
        assert "analysis" in event
        assert "name" in event
        assert "date" in event
        assert "id" in event


def test_get_history_scoped_to_user(client):
    post_event(client, TRANSCRIPTS[0])
    resp = client.get("/api/users/other-user/history")
    assert resp.json() == []


def test_get_history_multiple_users_isolated(client):
    client.post("/api/events", json={"user_id": "user-a", "event_text": TRANSCRIPTS[0]})
    client.post("/api/events", json={"user_id": "user-b", "event_text": TRANSCRIPTS[1]})

    assert len(client.get("/api/users/user-a/history").json()) == 1
    assert len(client.get("/api/users/user-b/history").json()) == 1


def test_get_history_returns_multiple_events(client):
    for transcript in TRANSCRIPTS[:3]:
        post_event(client, transcript)

    events = client.get(f"/api/users/{USER_ID}/history").json()
    assert len(events) == 3


def test_signals_sum_to_100(client):
    post_event(client, TRANSCRIPTS[0])
    events = client.get(f"/api/users/{USER_ID}/history").json()
    total = sum(events[0]["signals"].values())
    assert abs(total - 100.0) < 0.01


def test_signals_have_all_12_competencies(client):
    post_event(client, TRANSCRIPTS[0])
    events = client.get(f"/api/users/{USER_ID}/history").json()
    assert len(events[0]["signals"]) == 12


def test_all_transcripts_accepted(client):
    for transcript in TRANSCRIPTS:
        resp = post_event(client, transcript)
        assert resp.status_code == 201


def test_all_team_transcripts_accepted(client):
    for transcript in COMPLEX_TEAM_TRANSCRIPTS:
        resp = post_event(client, transcript)
        assert resp.status_code == 201


def test_all_chats_accepted(client):
    for chat in ALLY_CHAT_CONVERSATIONS:
        resp = post_event(client, format_chat(chat))
        assert resp.status_code == 201
