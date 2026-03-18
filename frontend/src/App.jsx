import { useEffect, useState } from "react";
import Header from "./components/Header";
import Timeline from "./components/Timeline";
import CoachingTitle from "./components/CoachingTitle";
import DateFilter from "./components/DateFilter";
import CompetencyAnalysis from "./components/CompetencyAnalysis";
import LoadingState from "./components/LoadingState";
import { mockData } from "./data/mockData";

const HISTORY_ENDPOINT = "http://localhost:8000/api/users/maya-001/history";
const NEXT_ACTION_ENDPOINT = "http://localhost:8000/api/users/maya-001/next-action";

// Maps the backend event_type slug -> the real display name used in the UI
const NAME_TO_TYPE = {
  "1_o_1":             "One on One Coaching",
  "ally_conversation": "Ally Conversation",
  "team_coaching":     "Team Coaching",
  "intake_survey":     "Intake Survey",
  "360_debrief":       "360 Debrief",
};

// Convert snake_case -> Title Case for unknown event types
const formatEventName = (name) =>
  String(name)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Enrich a raw API event with display-ready fields
const enrichEvent = (event) => ({
  ...event,
  type: NAME_TO_TYPE[event.name] ?? "One on One Coaching",
  name: NAME_TO_TYPE[event.name] ?? formatEventName(event.name),
});

function normalizeJourneyData(payload) {
  if (Array.isArray(payload)) {
    return { events: payload.map(enrichEvent), nextStep: null };
  }

  if (payload && typeof payload === "object") {
    return {
      ...payload,
      events: Array.isArray(payload.events)
        ? payload.events.map(enrichEvent)
        : [],
      nextStep: payload.nextStep ?? null,
    };
  }

  return { events: [], nextStep: null };
}

function normalizeNextAction(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const suggestion = typeof payload.suggestion === "string"
    ? payload.suggestion.trim()
    : "";

  if (!suggestion) {
    return null;
  }

  return {
    suggestion,
    related_competencies: Array.isArray(payload.related_competencies)
      ? payload.related_competencies
      : [],
    based_on_events: Array.isArray(payload.based_on_events)
      ? payload.based_on_events
      : [],
  };
}

function isJourneyDataEmpty(data) {
  return !Array.isArray(data?.events) || data.events.length === 0;
}

export default function App() {
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [journeyData, setJourneyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadJourneyData = async () => {
      setIsLoading(true);

      let baseData = mockData;

      try {
        const response = await fetch(HISTORY_ENDPOINT);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        console.log("Journey history API response:", payload);

        const data = normalizeJourneyData(payload);

        if (isJourneyDataEmpty(data)) {
          console.log("Journey history API returned no events. Falling back to mock data.");
        } else {
          baseData = data;
        }
      } catch (error) {
        console.log("Journey history API request failed. Falling back to mock data.", error);
      }

      let nextStep = baseData.nextStep ?? null;

      try {
        const response = await fetch(NEXT_ACTION_ENDPOINT);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        console.log("Next action API response:", payload);

        const normalizedNextAction = normalizeNextAction(payload);

        if (normalizedNextAction) {
          nextStep = normalizedNextAction;
        } else {
          console.log("Next action API returned an empty suggestion. Keeping the current next step.");
        }
      } catch (error) {
        console.log("Next action API request failed. Keeping the current next step.", error);
      }

      if (!cancelled) {
        setJourneyData({
          ...baseData,
          nextStep,
        });
        setIsLoading(false);
      }
    };

    loadJourneyData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fbfd" }}>
      <Header />

      <main style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {isLoading ? (
          <LoadingState />
        ) : (
          <>

            {/* ── Top row: Title card + Calendar ── */}
            <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
              {/* Title card — takes all remaining space */}
              <div style={{ flex: 1 }}>
                <CoachingTitle
                  name="Maya Fernandez"
                  company="Ferrari"
                  program="One on One Coaching"
                  totalSessions={journeyData.events.length}
                  startDate="Jan 2026"
                />
              </div>

              <div style={{ flex: 1 }}>
                <DateFilter
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onChange={setDateRange}
                />
              </div>
            </div>

            {/* ── Timeline ── */}
            <div style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 3px 16px rgba(0,66,102,0.09)",
              overflow: "hidden",
            }}>
              <Timeline
                events={journeyData.events}
                nextStep={journeyData.nextStep}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </div>

            {/* ── Competency Analysis (below timeline) ── */}
            <CompetencyAnalysis events={journeyData.events} />
          </>
        )}
      </main>
    </div>
  );
}
