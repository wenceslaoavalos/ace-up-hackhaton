import { useState, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { getCompetencyColor } from "../utils/competencyColors";

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  "Intake Survey":        { color: "#004266", label: "Intake Survey" },
  "One on One Coaching":  { color: "#008af8", label: "One on One Coaching" },
  "Ally Conversation":    { color: "#2ab34b", label: "Ally Conversation" },
  "Team Coaching":        { color: "#9b59b6", label: "Team Coaching" },
  "360 Debrief":          { color: "#f57800", label: "360 Debrief" },
  nextStep:               { color: "#ffb800", label: "Next Step" },
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

// ─── Dimensions ───────────────────────────────────────────────────────────────

const DOT_R      = 14;   // dot radius (px)
const LINE_Y     = 210;  // line Y from top of track container
const V_OFFSET   = 110;  // vertical distance from line to dot centre
const TRACK_H    = 350;  // total track height
const MARGIN     = 100;  // px inset before first / after last dot
const MIN_SLOT_W = 185;  // minimum px between adjacent slots
const NUDGE_PX   = 20;   // horizontal nudge for same-date stacked events

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

function EventModal({ item, onClose, onRegenerateNextStep }) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  if (!item) return null;
  const isNextStep = item._isNextStep;
  const cfg = TYPE_CONFIG[isNextStep ? "nextStep" : item.type] || TYPE_CONFIG["One on One Coaching"];

  const chartData = isNextStep ? [] : Object.entries(item.signals || {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name: COMPETENCY_SHORT[name] || name,
      fullName: name,
      value,
      fill: getCompetencyColor(name),
    }));

  const handleRegenerate = async () => {
    if (!onRegenerateNextStep || isRegenerating) return;

    setIsRegenerating(true);
    try {
      await onRegenerateNextStep();
    } finally {
      setIsRegenerating(false);
    }
  };

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
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
              {isNextStep && (
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  style={{
                    background: "#fff7db",
                    color: "#9b6b00",
                    border: "1px solid #ffd76a",
                    borderRadius: 999,
                    padding: "5px 10px",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: isRegenerating ? "wait" : "pointer",
                    opacity: isRegenerating ? 0.7 : 1,
                  }}
                >
                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                </button>
              )}
            </div>
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
                Suggested Next Step
              </p>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 15, color: "#585f66", margin: "8px 0 0", lineHeight: 1.7, fontWeight: 500 }}>
                {item.suggestion || item.name || "Continue the coaching journey with Ally."}
              </p>
              <button
                type="button"
                style={{
                  marginTop: 18,
                  background: "#008af8",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 8px 18px rgba(0,138,248,0.22)",
                }}
              >
                New chat with Ally
              </button>
            </div>
          </div>
        )}

        {/* Analysis + Chart */}
        {!isNextStep && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 13, color: "#004266", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Event Analysis
              </h4>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 14, color: "#585f66", lineHeight: 1.75, margin: 0 }}>
                {item.analysis}
              </p>
            </div>
            <div>
              <h4 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 13, color: "#004266", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Focus Areas
              </h4>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, color: "#7a8086", lineHeight: 1.6, margin: "0 0 16px" }}>
                Competency signals detected in this session, showing the relative weight of each focus area.
              </p>
              <ResponsiveContainer width="100%" height={Math.max(chartData.length * 44, 140)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 148, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 35]} tickFormatter={(v) => `${v}%`}
                    tick={{ fontFamily: "Poppins", fontSize: 11, fill: "#7a8086" }}
                    axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={160} interval={0}
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

export default function Timeline({ events, nextStep, startDate, endDate, onRegenerateNextStep }) {
  const [selected, setSelected]     = useState(null);
  const [activeType, setActiveType] = useState(null);
  const scrollRef                   = useRef(null);
  const outerRef                    = useRef(null);
  const [outerWidth, setOuterWidth] = useState(0);

  // Measure the scrollable viewport width
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setOuterWidth(entry.contentRect.width);
    });
    obs.observe(el);
    setOuterWidth(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (selected?._isNextStep) {
      setSelected(nextStep ? { ...nextStep, _isNextStep: true } : null);
    }
  }, [nextStep, selected?._isNextStep]);

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

  // ── Pixel-based slot positions ────────────────────────────────────────────

  const totalSlots = groups.length + (nextStep ? 1 : 0);

  // Minimum track width to keep slots at least MIN_SLOT_W apart
  const minTrackW = totalSlots <= 1
    ? MARGIN * 2 + 200
    : MARGIN * 2 + (totalSlots - 1) * MIN_SLOT_W;

  // Fill the container when few events; scroll when many
  const trackWidth = outerWidth > 0 ? Math.max(outerWidth, minTrackW) : minTrackW;

  // Pixel X centre for slot index i
  const slotXPx = (i) => {
    if (totalSlots <= 1) return trackWidth / 2;
    return MARGIN + (i / (totalSlots - 1)) * (trackWidth - 2 * MARGIN);
  };

  const groupSlotX = groups.map((_, i) => slotXPx(i));
  const nextStepX  = nextStep ? slotXPx(totalSlots - 1) : null;

  // Line endpoints match first and last slot
  const lineLeft  = slotXPx(0);
  const lineRight = slotXPx(totalSlots - 1);

  const canScroll = trackWidth > outerWidth + 2;

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
        <div style={{ position: "relative" }} ref={outerRef}>
          {/* Scroll arrows — only when content overflows */}
          {canScroll && ["left","right"].map((dir) => (
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
            style={{ overflowX: "auto", scrollbarWidth: "thin" }}
          >
            <div style={{ position: "relative", height: TRACK_H, width: trackWidth }}>

              {/* Gradient line — from first slot to last slot */}
              <div style={{
                position: "absolute",
                top: LINE_Y,
                left: lineLeft,
                width: lineRight - lineLeft,
                height: 5, borderRadius: 5,
                background: "linear-gradient(to right, #008af8 35%, #00d4ff 101%)",
              }} />

              {/* Start cap */}
              <div style={{
                position: "absolute", top: LINE_Y, left: lineLeft,
                width: 14, height: 14, borderRadius: "50%",
                background: "#008af8",
                transform: "translate(-50%, -50%)",
              }} />

              {/* Event groups */}
              {groups.map((group, gIdx) => {
                const baseX = groupSlotX[gIdx];
                return group.events.map((event, idx) => {
                  const cfg     = TYPE_CONFIG[event.type] || TYPE_CONFIG["One on One Coaching"];
                  const isAbove = idx % 2 === 0;
                  const nudge   = group.events.length > 1 ? (idx === 0 ? -NUDGE_PX : NUDGE_PX) : 0;
                  const xPx     = baseX + nudge;

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
                        left: xPx, top: connTop,
                        width: 1.5, height: connH,
                        background: cfg.color, opacity: 0.4,
                        transform: "translateX(-50%)",
                      }} />

                      {/* Dot */}
                      <div
                        onClick={() => setSelected(event)}
                        style={{
                          position: "absolute",
                          left: xPx, top: dotCY,
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
                        left: xPx, top: dateCssTop,
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
                          left: xPx, top: nameCssTop,
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
              {nextStep && nextStepX !== null && (() => {
                const xPx     = nextStepX;
                const cfg     = TYPE_CONFIG.nextStep;
                const dotCY   = LINE_Y - V_OFFSET;
                const connTop = dotCY + DOT_R;
                const connH   = LINE_Y - dotCY - DOT_R;

                return (
                  <div key="nextStep">
                    <div style={{
                      position: "absolute",
                      left: xPx, top: connTop,
                      width: 1.5, height: connH,
                      background: cfg.color, opacity: 0.55,
                      transform: "translateX(-50%)",
                    }} />

                    {/* Diamond */}
                    <div
                      onClick={() => setSelected({ ...nextStep, _isNextStep: true })}
                      style={{
                        position: "absolute",
                        left: xPx, top: dotCY,
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

                    {/* Label */}
                    <div style={{
                      position: "absolute",
                      left: xPx, top: dotCY + DOT_R + 8,
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
                        left: xPx, top: dotCY - DOT_R - 52,
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
        onRegenerateNextStep={onRegenerateNextStep}
      />
    </div>
  );
}
