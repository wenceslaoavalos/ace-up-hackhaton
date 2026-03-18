import { useState } from "react";
import Header from "./components/Header";
import Timeline from "./components/Timeline";
import CoachingTitle from "./components/CoachingTitle";
import DateFilter from "./components/DateFilter";
import CompetencyAnalysis from "./components/CompetencyAnalysis";
import { mockData } from "./data/mockData";

export default function App() {
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  return (
    <div style={{ minHeight: "100vh", background: "#f9fbfd" }}>
      <Header />

      <main style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Top row: Title card + Calendar ── */}
        <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
          {/* Title card — takes all remaining space */}
          <div style={{ flex: 1 }}>
            <CoachingTitle
              name="Lewis Hamilton"
              company="Ferrari"
              program="One on One Coaching"
              totalSessions={mockData.events.length}
              startDate="Jan 2026"
            />
          </div>

          {/* Calendar — compact fixed width */}
          <div style={{ flexShrink: 0 }}>
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
            events={mockData.events}
            nextStep={mockData.nextStep}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </div>

        {/* ── Competency Analysis (below timeline) ── */}
        <CompetencyAnalysis events={mockData.events} />

      </main>
    </div>
  );
}
