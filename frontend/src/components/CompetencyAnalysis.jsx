import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
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

const PieTooltip = ({ active, payload }) => {
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

export default function CompetencyAnalysis({ events }) {
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
      padding: "36px 40px",
    }}>
      {/* Section header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontFamily: '"Source Serif Pro", serif',
          fontSize: 26, fontWeight: 700,
          color: "#343a40", margin: "0 0 10px",
        }}>
          Focus Areas
        </h2>
        <p style={{
          fontFamily: "Poppins, sans-serif",
          fontSize: 14, color: "#585f66",
          lineHeight: 1.65, margin: 0,
          maxWidth: 640,
        }}>
          Cumulative distribution of coaching focus across all sessions — where time and attention have been invested throughout the journey.
        </p>
      </div>

      {/* Charts row */}
      <div style={{ display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* ── Donut chart + legend ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, flex: "0 0 auto" }}>
          <PieChart width={280} height={280}>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={78}
              outerRadius={130}
              paddingAngle={1.5}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>

          {/* Donut legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {data.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 10, height: 10,
                  borderRadius: "50%", background: d.fill, flexShrink: 0,
                }} />
                <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, color: "#585f66", flex: 1, whiteSpace: "nowrap" }}>
                  {d.name}
                </span>
                <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, fontWeight: 700, color: d.fill, marginLeft: 12 }}>
                  {d.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Horizontal bar chart ── */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <h4 style={{
            fontFamily: "Poppins, sans-serif", fontSize: 12, fontWeight: 600,
            color: "#004266", textTransform: "uppercase", letterSpacing: "0.08em",
            margin: "0 0 20px",
          }}>
            Focus Areas Breakdown
          </h4>
          <ResponsiveContainer width="100%" height={data.length * 36}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 148, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f0f4fa" />
              <XAxis
                type="number"
                domain={[0, Math.ceil(data[0].value / 5) * 5 + 5]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontFamily: "Poppins", fontSize: 11, fill: "#7a8086" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category" dataKey="name" width={140}
                tick={{ fontFamily: "Poppins", fontSize: 12, fill: "#585f66" }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${v}%`, "Cumulative focus"]}
                labelFormatter={(l) => data.find((d) => d.name === l)?.fullName || l}
                contentStyle={{
                  fontFamily: "Poppins", fontSize: 12,
                  borderRadius: 8, border: "1px solid #e8ecf0",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} background={{ fill: "#f0f4fa", radius: [0, 6, 6, 0] }}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
