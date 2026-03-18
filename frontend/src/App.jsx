import { useEffect, useState } from "react";
import Header from "./components/Header";
import Timeline from "./components/Timeline";
import CoachingTitle from "./components/CoachingTitle";
import DateFilter from "./components/DateFilter";
import CompetencyAnalysis from "./components/CompetencyAnalysis";
import LoadingState from "./components/LoadingState";
import { mockData } from "./data/mockData";

export default function App() {
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [journeyData, setJourneyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadJourneyData = async () => {
      setIsLoading(true);

      try {
        // Replace this with the backend request once the API is ready.
        const data = await Promise.resolve(mockData);

        if (!cancelled) {
          setJourneyData(data);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
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
                  name="Lewis Hamilton"
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
