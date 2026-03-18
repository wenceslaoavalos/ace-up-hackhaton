import { useState, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  intake:   { color: "#004266", label: "Intake Debrief" },
  "1on1":   { color: "#008af8", label: "1-on-1 Coaching" },
  ally:     { color: "#2ab34b", label: "Ally Chat Session" },
  "360":    { color: "#f57800", label: "360 Debrief" },
  nextStep: { color: "#ffb800", label: "Next Step" },
};

const ACTION_LABELS = {
  roleplay:       "Role Play Session",
  "1on1coaching": "1-on-1 Coaching",
  groupcoaching:  "Group Coaching",
  assessment:     "Assessment",
  workshop:       "Workshop",
};

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

const CHART_COLORS = [
  "#008af8","#004266","#f57800","#2ab34b",
  "#ffb800","#de2c2c","#5d778d","#00d4ff",
  "#9b59b6","#e67e22","#1abc9c","#e74c3c",
];

// ─── Dimensions ───────────────────────────────────────────────────────────────

const DOT_R      = 14;   // dot radius (px)
const LINE_Y     = 210;  // line Y from top of track container
const V_OFFSET   = 110;  // vertical distance from line to dot centre
const TRACK_H    = 410;  // total track height
const TRACK_W    = 2600; // minimum track width (px)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

const fmtShort = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

const groupByDate = (events) => {
  const map = {};
  events.forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
  return Object.entries(map)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, events]) => ({ date, events }));
};

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventModal({ item, onClose }) {
  if (!item) return null;
  const isNextStep = item._isNextStep;
  const cfg = TYPE_CONFIG[isNextStep ? "nextStep" : item.type] || TYPE_CONFIG["1on1"];

  const chartData = isNextStep ? [] : Object.entries(item.signals || {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value], i) => ({
      name: COMPETENCY_SHORT[name] || name,
      fullName: name,
      value,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(4,18,40,0.45)",
        zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, backdropFilter: "blur(3px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: 18,
        padding: "32px 36px",
        maxWidth: 700, width: "100%",
        maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,66,102,0.22)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <span style={{
              background: cfg.color,
              color: isNextStep ? "#343a40" : "#fff",
              borderRadius: 20, padding: "4px 14px",
              fontSize: 11, fontWeight: 600,
              fontFamily: "Poppins, sans-serif",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {cfg.label}
            </span>
            <h2 style={{
              fontFamily: '"Source Serif Pro", serif',
              fontSize: 26, fontWeight: 600,
              color: "#f57800", margin: "10px 0 4px",
            }}>
              {item.name}
            </h2>
            {!isNextStep && (
              <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 13, color: "#7a8086" }}>
                {fmt(item.date)}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "#f0f4fa", border: "none",
            fontSize: 20, cursor: "pointer", color: "#7a8086",
            width: 36, height: 36, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 12,
          }}>×</button>
        </div>

        {/* Next-step card */}
        {isNextStep && (
          <div style={{
            background: "linear-gradient(135deg,#fffbf0,#fff8e1)",
            border: "1.5px solid #ffb80040",
            borderRadius: 14, padding: "24px 28px",
            display: "flex", alignItems: "center", gap: 20,
          }}>
            <div style={{
              width: 54, height: 54, background: "#ffb800",
              borderRadius: 14, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 26, flexShrink: 0,
            }}>⚡</div>
            <div>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, color: "#7a8086", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Upcoming Activity
              </p>
              <p style={{ fontFamily: '"Source Serif Pro", serif', fontSize: 22, color: "#004266", margin: "6px 0 0", fontWeight: 600 }}>
                {ACTION_LABELS[item.action_id] || item.action_id}
              </p>
            </div>
          </div>
        )}

        {/* Analysis + Chart */}
        {!isNextStep && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 13, color: "#004266", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Session Analysis
              </h4>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 14, color: "#585f66", lineHeight: 1.75, margin: 0 }}>
                {item.analysis}
              </p>
            </div>
            <div>
              <h4 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 13, color: "#004266", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Competency Signals
              </h4>
              <ResponsiveContainer width="100%" height={chartData.length * 34}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 148, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 35]} tickFormatter={(v) => `${v}%`}
                    tick={{ fontFamily: "Poppins", fontSize: 11, fill: "#7a8086" }}
                    axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={140}
                    tick={{ fontFamily: "Poppins", fontSize: 12, fill: "#585f66" }}
                    axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Signal strength"]}
                    labelFormatter={(l) => chartData.find((d) => d.name === l)?.fullName || l}
                    contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 8, border: "1px solid #e8ecf0", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} background={{ fill: "#f0f4fa", radius: [0, 6, 6, 0] }}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Timeline({ events, nextStep, startDate, endDate }) {
  const [selected, setSelected]         = useState(null);
  const [activeType, setActiveType]     = useState(null); // legend filter
  const scrollRef                       = useRef(null);

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      if (startDate && d < startDate) return false;
      if (endDate   && d > endDate)   return false;
      if (activeType && e.type !== activeType) return false;
      return true;
    });
  }, [events, startDate, endDate, activeType]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  // ── X positioning ────────────────────────────────────────────────────────

  const timestamps = groups.map((g) => new Date(g.date).getTime());
  const minT = timestamps.length ? Math.min(...timestamps) : 0;
  const maxT = timestamps.length ? Math.max(...timestamps) : 0;
  const span = maxT - minT || 1;

  // 2% → 90% range for regular events; next-step always at 95%
  const xPct = (dateStr) => {
    if (groups.length <= 1) return 46;
    return ((new Date(dateStr).getTime() - minT) / span) * 88 + 2;
  };

  // ── Scroll helpers ───────────────────────────────────────────────────────

  const scroll = (dir) =>
    scrollRef.current?.scrollBy({ left: dir * 400, behavior: "smooth" });

  // ── Legend toggle ────────────────────────────────────────────────────────

  const toggleType = (type) =>
    setActiveType((prev) => (prev === type ? null : type));

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── Legend ── */}
      <div style={{
        padding: "18px 32px",
        background: "#fff",
        borderBottom: "1px solid #e8ecf0",
        display: "flex", gap: 8, flexWrap: "wrap",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#7a8086", marginRight: 6 }}>
          FILTER BY TYPE:
        </span>
        {Object.entries(TYPE_CONFIG).map(([key, { color, label }]) => {
          const isActive = activeType === key;
          const isDimmed = activeType && activeType !== key;
          return (
            <button
              key={key}
              onClick={() => toggleType(key)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                border: `1.5px solid ${isActive ? color : "#e8ecf0"}`,
                background: isActive ? color + "18" : "#fff",
                opacity: isDimmed ? 0.4 : 1,
                transition: "all 0.18s ease",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              <div style={{
                width: key === "nextStep" ? 10 : 11,
                height: key === "nextStep" ? 10 : 11,
                borderRadius: key === "nextStep" ? 2 : "50%",
                background: color,
                transform: key === "nextStep" ? "rotate(45deg)" : "none",
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? color : "#585f66",
                whiteSpace: "nowrap",
              }}>
                {label}
              </span>
            </button>
          );
        })}
        {activeType && (
          <button
            onClick={() => setActiveType(null)}
            style={{
              padding: "6px 12px", borderRadius: 20,
              border: "1.5px solid #dbdbdb",
              background: "#fff", cursor: "pointer",
              fontFamily: "Poppins, sans-serif",
              fontSize: 11, color: "#7a8086", fontWeight: 600,
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Track ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#7a8086", fontSize: 14 }}>
          No sessions match the current filters.
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {/* Scroll arrows */}
          {["left","right"].map((dir) => (
            <button
              key={dir}
              onClick={() => scroll(dir === "right" ? 1 : -1)}
              style={{
                position: "absolute",
                [dir]: 0, top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                background: "#fff",
                border: "1.5px solid #e8ecf0",
                borderRadius: "50%",
                width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                fontSize: 18, color: "#008af8",
                fontWeight: 700,
              }}
            >
              {dir === "left" ? "‹" : "›"}
            </button>
          ))}

          {/* Scrollable viewport */}
          <div
            ref={scrollRef}
            style={{ overflowX: "auto", padding: "0 8px", scrollbarWidth: "thin" }}
          >
            <div style={{ position: "relative", height: TRACK_H, minWidth: TRACK_W }}>

              {/* Gradient line */}
              <div style={{
                position: "absolute",
                top: LINE_Y, left: "2%", right: "2%",
                height: 5, borderRadius: 5,
                background: "linear-gradient(to right, #008af8 35%, #00d4ff 101%)",
              }} />

              {/* Start cap */}
              <div style={{
                position: "absolute", top: LINE_Y, left: "2%",
                width: 14, height: 14, borderRadius: "50%",
                background: "#008af8",
                transform: "translate(-50%, -50%)",
              }} />

              {/* Event groups */}
              {groups.map((group) => {
                const xp = xPct(group.date);
                return group.events.map((event, idx) => {
                  const cfg    = TYPE_CONFIG[event.type] || TYPE_CONFIG["1on1"];
                  const isAbove = idx % 2 === 0;
                  const xNudge = group.events.length > 1 ? (idx === 0 ? -2 : 2) : 0;
                  const xFinal = xp + xNudge;

                  const dotCY      = LINE_Y + (isAbove ? -V_OFFSET : V_OFFSET);
                  const connTop    = isAbove ? dotCY + DOT_R : LINE_Y;
                  const connH      = isAbove ? LINE_Y - dotCY - DOT_R : dotCY - DOT_R - LINE_Y;
                  const nameCssTop = isAbove ? dotCY - DOT_R - 52 : dotCY + DOT_R + 28;
                  const dateCssTop = isAbove ? dotCY + DOT_R + 8  : dotCY - DOT_R - 26;

                  return (
                    <div key={event.id}>
                      {/* Connector */}
                      <div style={{
                        position: "absolute",
                        left: `${xFinal}%`, top: connTop,
                        width: 1.5, height: connH,
                        background: cfg.color, opacity: 0.4,
                        transform: "translateX(-50%)",
                      }} />

                      {/* Dot */}
                      <div
                        onClick={() => setSelected(event)}
                        style={{
                          position: "absolute",
                          left: `${xFinal}%`, top: dotCY,
                          width: DOT_R * 2, height: DOT_R * 2,
                          borderRadius: "50%",
                          background: cfg.color,
                          border: "4px solid #fff",
                          boxShadow: `0 3px 14px ${cfg.color}55`,
                          transform: "translate(-50%, -50%)",
                          cursor: "pointer",
                          transition: "transform 0.18s, box-shadow 0.18s",
                          zIndex: 4,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.45)";
                          e.currentTarget.style.boxShadow = `0 5px 20px ${cfg.color}99`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)";
                          e.currentTarget.style.boxShadow = `0 3px 14px ${cfg.color}55`;
                        }}
                      />

                      {/* Date */}
                      <div style={{
                        position: "absolute",
                        left: `${xFinal}%`, top: dateCssTop,
                        transform: "translateX(-50%)",
                        fontSize: 12, color: "#7a8086",
                        fontWeight: 600, whiteSpace: "nowrap",
                        pointerEvents: "none",
                      }}>
                        {fmtShort(event.date)}
                      </div>

                      {/* Name */}
                      <div
                        onClick={() => setSelected(event)}
                        style={{
                          position: "absolute",
                          left: `${xFinal}%`, top: nameCssTop,
                          transform: "translateX(-50%)",
                          width: 140,
                          textAlign: "center",
                          fontSize: 12, fontWeight: 700,
                          color: "#343a40",
                          cursor: "pointer",
                          lineHeight: 1.35,
                        }}
                      >
                        {event.name}
                      </div>
                    </div>
                  );
                });
              })}

              {/* ── Next Step ── */}
              {nextStep && (() => {
                const xp      = 95;
                const cfg     = TYPE_CONFIG.nextStep;
                const dotCY   = LINE_Y - V_OFFSET;
                const connTop = dotCY + DOT_R;
                const connH   = LINE_Y - dotCY - DOT_R;

                return (
                  <div key="nextStep">
                    <div style={{
                      position: "absolute",
                      left: `${xp}%`, top: connTop,
                      width: 1.5, height: connH,
                      background: cfg.color, opacity: 0.55,
                      transform: "translateX(-50%)",
                    }} />

                    {/* Diamond */}
                    <div
                      onClick={() => setSelected({ ...nextStep, _isNextStep: true })}
                      style={{
                        position: "absolute",
                        left: `${xp}%`, top: dotCY,
                        width: DOT_R * 2, height: DOT_R * 2,
                        borderRadius: 3,
                        background: cfg.color,
                        border: "4px solid #fff",
                        boxShadow: `0 3px 14px ${cfg.color}66`,
                        transform: "translate(-50%,-50%) rotate(45deg)",
                        cursor: "pointer",
                        transition: "transform 0.18s",
                        zIndex: 4,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translate(-50%,-50%) rotate(45deg) scale(1.45)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translate(-50%,-50%) rotate(45deg) scale(1)";
                      }}
                    />

                    {/* Date */}
                    <div style={{
                      position: "absolute",
                      left: `${xp}%`, top: dotCY + DOT_R + 8,
                      transform: "translateX(-50%)",
                      fontSize: 12, color: cfg.color,
                      fontWeight: 700, whiteSpace: "nowrap",
                    }}>
                      Upcoming
                    </div>

                    {/* Name */}
                    <div
                      onClick={() => setSelected({ ...nextStep, _isNextStep: true })}
                      style={{
                        position: "absolute",
                        left: `${xp}%`, top: dotCY - DOT_R - 52,
                        transform: "translateX(-50%)",
                        width: 140, textAlign: "center",
                        fontSize: 12, fontWeight: 700,
                        color: "#343a40", cursor: "pointer",
                        lineHeight: 1.35,
                      }}
                    >
                      Next Step
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      <EventModal
        item={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
