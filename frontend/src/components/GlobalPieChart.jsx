import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { getCompetencyColor } from "../utils/competencyColors";

const COMPETENCY_SHORT = {
  "Improving Time Management, Organization, and Productivity": "Time Management",
  "Developing Leadership Presence":                            "Leadership Presence",
  "Transitioning from Subject Matter Expert to Leadership":   "SME → Leader",
  "Communicating Effectively and Influencing Stakeholders":   "Communication",
  "Growing Emotional Intelligence":                           "Emotional IQ",
  "Managing Conflicts and Difficult Conversations":           "Conflict Management",
  "Regulating Stress and Building Resilience":                "Resilience",
  "Leading with a Growth Mindset":                            "Growth Mindset",
  "Facilitating Effective Change Management":                 "Change Management",
  "Collaborating Across The Organization":                    "Collaboration",
  "Developing a Coaching Approach to Management":             "Coaching Approach",
  "Building and Leading Inclusive Teams":                     "Inclusive Teams",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8ecf0",
      borderRadius: 8, padding: "8px 12px",
      fontFamily: "Poppins, sans-serif", fontSize: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    }}>
      <div style={{ color: "#343a40", fontWeight: 600, marginBottom: 2 }}>
        {payload[0].payload.fullName}
      </div>
      <div style={{ color: payload[0].payload.fill, fontWeight: 700, fontSize: 14 }}>
        {payload[0].value}%
      </div>
    </div>
  );
};

export default function GlobalPieChart({ events }) {
  if (!events?.length) return null;

  const competencies = Object.keys(events[0].signals);
  const totals = {};
  competencies.forEach((c) => {
    totals[c] = events.reduce((sum, e) => sum + (e.signals[c] || 0), 0);
  });
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);

  const data = competencies
    .map((c) => ({
      name: COMPETENCY_SHORT[c] || c,
      fullName: c,
      value: parseFloat(((totals[c] / grand) * 100).toFixed(1)),
      fill: getCompetencyColor(c),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 3px 16px rgba(0,66,102,0.09)",
      padding: "24px 28px",
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}>
      <h3 style={{
        fontFamily: '"Source Serif Pro", serif',
        fontSize: 18, fontWeight: 600,
        color: "#343a40", margin: 0,
      }}>
        Overall Competency Focus
      </h3>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 28 }}>
        {/* Donut chart — bigger */}
        <div style={{ flexShrink: 0 }}>
          <PieChart width={240} height={240}>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={68}
              outerRadius={110}
              paddingAngle={1.5}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </div>

        {/* Legend — single column, full names */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, paddingTop: 6 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 10, height: 10,
                borderRadius: "50%",
                background: d.fill,
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 12, color: "#585f66",
                flex: 1,
              }}>
                {d.name}
              </span>
              <span style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 12, fontWeight: 700,
                color: d.fill, flexShrink: 0,
              }}>
                {d.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
