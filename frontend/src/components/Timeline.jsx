import { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import ReactMarkdown from "react-markdown";
import { getCompetencyColor } from "../utils/competencyColors";
import DateFilter from "./DateFilter";

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  "Intake Survey":        { color: "#004266", label: "Intake Survey" },
  "One on One Coaching":  { color: "#008af8", label: "One on One Coaching" },
  "Ally Conversation":    { color: "#2ab34b", label: "Ally Conversation" },
  "Team Coaching":        { color: "#9b59b6", label: "Team Coaching" },
  "360 Debrief":          { color: "#f57800", label: "360 Debrief" },
  nextStep:               { color: "#ffb800", label: "Coaching Compass" },
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

const fmtShort = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", year: "numeric",
  });

const groupByMonth = (events) => {
  const map = {};
  [...events]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((e) => {
      const d = new Date(e.date + "T00:00:00");
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map[key]) map[key] = { key, label, events: [] };
      map[key].events.push(e);
    });
  return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
};

const getTopCompetencies = (signals, n = 2) =>
  Object.entries(signals || {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name]) => name);

const stripMarkdown = (text = "") =>
  text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/#+\s/g, "");

// ─── Visual Graph Timeline ────────────────────────────────────────────────────

const TOOLTIP_W = 268;

function VisualTimeline({ events, nextStep, onEventClick }) {
  const containerRef   = useRef(null);
  const tooltipTimeout = useRef(null);
  const autoTimers     = useRef([]);
  const autoIndexRef   = useRef(0);
  const sortedRef      = useRef([]);

  const [width, setWidth]                   = useState(0);
  const [tooltipData, setTooltipData]       = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  // Auto-play: up to 2 event objects shown simultaneously
  const [autoPair, setAutoPair]   = useState([]);
  const [autoVisible, setAutoVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    obs.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, []);

  // ── Hover tooltip helpers ────────────────────────────────────────────────
  const showTooltip = (data) => {
    clearTimeout(tooltipTimeout.current);
    setTooltipData(data);
    requestAnimationFrame(() => requestAnimationFrame(() => setTooltipVisible(true)));
  };
  const hideTooltip = () => {
    setTooltipVisible(false);
    tooltipTimeout.current = setTimeout(() => setTooltipData(null), 220);
  };

  const isHovering = !!tooltipData;

  // ── Auto-play: cycle through pairs of events ─────────────────────────────
  useEffect(() => {
    const clearAll = () => autoTimers.current.forEach(clearTimeout);

    if (isHovering) {
      // Pause: fade out current auto pair, clear pending timers
      setAutoVisible(false);
      clearAll();
      return clearAll;
    }

    if (!width) return clearAll;

    const cycle = () => {
      clearAll();
      const s = sortedRef.current;
      if (!s.length) return;

      // Pick event A at current index, event B halfway through the list
      // to guarantee visual separation on the timeline
      const i = autoIndexRef.current % s.length;
      autoIndexRef.current = (i + 1) % s.length;

      setAutoPair([s[i]]);
      setAutoVisible(false);

      const t1 = setTimeout(() => setAutoVisible(true), 80);   // fade in
      const t2 = setTimeout(() => setAutoVisible(false), 3400); // fade out
      const t3 = setTimeout(cycle, 3900);                       // next pair
      autoTimers.current = [t1, t2, t3];
    };

    const initial = setTimeout(cycle, 1200); // short initial delay
    autoTimers.current = [initial];
    return clearAll;
  }, [isHovering, width, events]);

  if (!events.length) return null;

  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  sortedRef.current = sorted; // keep in sync for the effect

  const PADDING = 32;
  const LINE_Y  = 42;
  const DOT_R   = 7;

  const allMs  = sorted.map((e) => new Date(e.date + "T00:00:00").getTime());
  const minMs  = allMs[0];
  const span   = (allMs[allMs.length - 1] - minMs) || 1;
  const maxMs  = nextStep ? allMs[allMs.length - 1] + span * 0.14 : allMs[allMs.length - 1];

  const toX = (isoDate) => {
    const t = new Date(isoDate + "T00:00:00").getTime();
    return PADDING + ((t - minMs) / (maxMs - minMs)) * (width - 2 * PADDING);
  };

  const nsX = PADDING + (width - 2 * PADDING);

  // Hover tooltip clamping
  const tipX = tooltipData
    ? Math.min(Math.max(tooltipData.x, TOOLTIP_W / 2 + 4), width - TOOLTIP_W / 2 - 4)
    : 0;
  const arrowShift = tooltipData ? tooltipData.x - tipX : 0;

  // Helper: render a tooltip card (shared between hover + auto)
  const renderCard = ({ key, x, title, date, preview, color, isNS, visible, zIndex = 20 }) => {
    const clamped     = Math.min(Math.max(x, TOOLTIP_W / 2 + 4), width - TOOLTIP_W / 2 - 4);
    const arrow       = x - clamped;
    const borderColor = color + "33";
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: clamped,
          top: LINE_Y + 22,
          width: TOOLTIP_W,
          transform: visible
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(5px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.5s ease, transform 0.5s ease",
          background: "#fff",
          border: `1px solid ${borderColor}`,
          borderRadius: 10,
          padding: "10px 13px",
          boxShadow: "0 4px 18px rgba(0,66,102,0.08)",
          zIndex,
          pointerEvents: "none",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {/* Arrow pointing up to the dot */}
        <div style={{
          position: "absolute", top: -6,
          left: `calc(50% + ${arrow}px)`,
          transform: "translateX(-50%) rotate(45deg)",
          width: 10, height: 10,
          background: "#fff",
          borderLeft: `1px solid ${borderColor}`,
          borderTop: `1px solid ${borderColor}`,
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 7, height: 7, flexShrink: 0, borderRadius: isNS ? 2 : "50%", background: color }} />
          <span style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: "0.04em" }}>{date}</span>
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#004266", margin: "0 0 4px", lineHeight: 1.35 }}>
          {title}
        </p>
        {preview && (
          <p style={{
            fontSize: 11, color: "#7a8086", margin: 0, lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {preview}
          </p>
        )}
      </div>
    );
  };

  const autoIds = new Set(autoPair.map((e) => e.id));

  return (
    <div ref={containerRef} style={{ position: "relative", height: 172, userSelect: "none" }}>
      {width > 0 && (
        <>
          {/* Gradient timeline line */}
          <div style={{
            position: "absolute", top: LINE_Y, left: PADDING,
            width: (nextStep ? nsX : toX(sorted[sorted.length - 1].date)) - PADDING,
            height: 4, borderRadius: 4,
            background: "linear-gradient(to right, #008af8 0%, #00d4ff 80%, #ffb800 100%)",
          }} />

          {/* Event dots */}
          {sorted.map((event) => {
            const cfg     = TYPE_CONFIG[event.type] || TYPE_CONFIG["One on One Coaching"];
            const x       = toX(event.date);
            const isHover = tooltipData?.id === event.id;
            const isAuto  = !isHovering && autoIds.has(event.id) && autoVisible;
            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                onMouseEnter={() => showTooltip({ id: event.id, x, event, color: cfg.color })}
                onMouseLeave={hideTooltip}
                style={{
                  position: "absolute", left: x, top: LINE_Y,
                  width: DOT_R * 2, height: DOT_R * 2, borderRadius: "50%",
                  background: cfg.color, border: "2.5px solid #fff",
                  boxShadow: `0 2px 10px ${cfg.color}66`,
                  transform: `translate(-50%, -50%) scale(${isHover ? 1.5 : isAuto ? 1.25 : 1})`,
                  cursor: "pointer", zIndex: 3,
                  transition: "transform 0.3s ease",
                }}
              />
            );
          })}

          {/* Next Step diamond */}
          {nextStep && (
            <div
              className="tl-diamond"
              onClick={() => onEventClick({ ...nextStep, _isNextStep: true })}
              onMouseEnter={() => showTooltip({ id: "ns", x: nsX, isNS: true, color: "#ffb800" })}
              onMouseLeave={hideTooltip}
              style={{
                position: "absolute", left: nsX, top: LINE_Y,
                width: 16, height: 16, background: "#ffb800",
                borderRadius: 3, border: "2.5px solid #fff",
                boxShadow: "0 2px 12px rgba(255,184,0,0.55)",
                transform: "translate(-50%, -50%) rotate(45deg)",
                cursor: "pointer", zIndex: 3,
              }}
            />
          )}

          {/* Start date label */}
          <span style={{
            position: "absolute", left: PADDING, top: LINE_Y + 14,
            fontSize: 11, color: "#7a8086", fontWeight: 600,
            fontFamily: "Poppins, sans-serif", transform: "translateX(-50%)", whiteSpace: "nowrap",
          }}>
            {fmtShort(sorted[0].date)}
          </span>

          {/* End label */}
          {nextStep ? (
            <span style={{
              position: "absolute", left: nsX, top: LINE_Y + 14,
              fontSize: 11, color: "#f57800", fontWeight: 700,
              fontFamily: "Poppins, sans-serif", transform: "translateX(-50%)", whiteSpace: "nowrap",
            }}>
              Up Next
            </span>
          ) : (
            <span style={{
              position: "absolute", left: toX(sorted[sorted.length - 1].date), top: LINE_Y + 14,
              fontSize: 11, color: "#7a8086", fontWeight: 600,
              fontFamily: "Poppins, sans-serif", transform: "translateX(-50%)", whiteSpace: "nowrap",
            }}>
              {fmtShort(sorted[sorted.length - 1].date)}
            </span>
          )}

          {/* ── Auto-play tooltips (2 at a time) ── */}
          {!isHovering && autoPair.map((event) => {
            const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG["One on One Coaching"];
            return renderCard({
              key: `auto-${event.id}`,
              x: toX(event.date),
              title: event.name,
              date: fmt(event.date),
              preview: event.takeaway || event.analysis || "",
              color: cfg.color,
              isNS: false,
              visible: autoVisible,
              zIndex: 10,
            });
          })}

          {/* ── Hover tooltip (always on top) ── */}
          {tooltipData && (() => {
            const { event, isNS, color } = tooltipData;
            return renderCard({
              key: "hover",
              x: tipX + arrowShift,  // pass real dot X so clamping works correctly
              title: isNS ? "Coaching Compass" : event?.name || "",
              date:  isNS ? "Up Next" : event ? fmt(event.date) : "",
              preview: isNS
                ? stripMarkdown(nextStep?.suggestion || "")
                : (event?.takeaway || event?.analysis || ""),
              color,
              isNS,
              visible: tooltipVisible,
              zIndex: 20,
            });
          })()}
        </>
      )}
    </div>
  );
}

// ─── Spine Row ────────────────────────────────────────────────────────────────

function SpineRow({ dotColor, isFirst, isLast, isDiamond, children }) {
  const lineColor = "#e8ecf0";
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
        <div style={{ height: 20, width: 2, background: isFirst ? "transparent" : lineColor }} />
        {isDiamond ? (
          <div
            className="tl-diamond"
            style={{
              width: 16, height: 16,
              background: dotColor,
              borderRadius: 3,
              border: "3px solid #fff",
              boxShadow: `0 0 0 2.5px ${dotColor}`,
              transform: "rotate(45deg)",
              flexShrink: 0, zIndex: 1,
            }}
          />
        ) : (
          <div style={{
            width: 14, height: 14,
            borderRadius: "50%",
            background: dotColor,
            border: "3px solid #fff",
            boxShadow: `0 0 0 2.5px ${dotColor}`,
            flexShrink: 0, zIndex: 1,
          }} />
        )}
        <div style={{ flex: 1, width: 2, background: isLast ? "transparent" : lineColor, minHeight: 8 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 14 }}>
        {children}
      </div>
    </div>
  );
}

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
    try { await onRegenerateNextStep(); } finally { setIsRegenerating(false); }
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{
                background: cfg.color, color: isNextStep ? "#343a40" : "#fff",
                borderRadius: 20, padding: "4px 14px",
                fontSize: 11, fontWeight: 600, fontFamily: "Poppins, sans-serif",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                {cfg.label}
              </span>
              {isNextStep && (
                <button type="button" onClick={handleRegenerate} disabled={isRegenerating} style={{
                  background: "#fff7db", color: "#9b6b00", border: "1px solid #ffd76a",
                  borderRadius: 999, padding: "5px 10px", fontFamily: "Poppins, sans-serif",
                  fontSize: 11, fontWeight: 600, cursor: isRegenerating ? "wait" : "pointer",
                  opacity: isRegenerating ? 0.7 : 1,
                }}>
                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                </button>
              )}
            </div>
            <h2 style={{ fontFamily: '"Source Serif Pro", serif', fontSize: 26, fontWeight: 600, color: "#f57800", margin: "10px 0 4px" }}>
              {isNextStep ? "Coaching Compass" : item.name}
            </h2>
            {!isNextStep && (
              <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 13, color: "#7a8086" }}>
                {fmt(item.date)}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "#f0f4fa", border: "none", fontSize: 20, cursor: "pointer", color: "#7a8086",
            width: 36, height: 36, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 12,
          }}>×</button>
        </div>

        {isNextStep && (
          <div style={{
            background: "linear-gradient(135deg,#fffbf0,#fff8e1)",
            border: "1.5px solid #ffb80040", borderRadius: 14, padding: "24px 28px",
            display: "flex", alignItems: "center", gap: 20,
          }}>
            <div style={{
              width: 54, height: 54, background: "#ffb800", borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, flexShrink: 0,
            }}>⚡</div>
            <div>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, color: "#7a8086", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Suggested Next Step
              </p>
              <ReactMarkdown components={{
                p: ({ children }) => (
                  <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 15, color: "#585f66", margin: "8px 0 0", lineHeight: 1.7, fontWeight: 500 }}>{children}</p>
                ),
                strong: ({ children }) => (
                  <strong style={{ color: "#343a40", fontWeight: 700 }}>{children}</strong>
                ),
              }}>
                {item.suggestion || item.name || "Continue the coaching journey with Ally."}
              </ReactMarkdown>
              <button type="button" style={{
                marginTop: 18, background: "#fff", color: "#008af8",
                border: "1px solid #cfe7fb", borderRadius: 999, padding: "10px 18px",
                fontFamily: "Poppins, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 8px 18px rgba(0,66,102,0.12)",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#eaf5ff"; e.currentTarget.style.borderColor = "#9fd0fb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cfe7fb"; }}
              >
                <img src="/img/ally_icon.svg" alt="AceUp Ally" style={{ width: 16, height: 16, display: "block" }} />
                Chat with Ally
              </button>
            </div>
          </div>
        )}

        {!isNextStep && (
          <>
            {item.takeaway && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 13, color: "#004266", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Key Takeaway
                </h4>
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 14, color: "#585f66", lineHeight: 1.75, margin: 0 }}>
                  {item.takeaway}
                </p>
              </div>
            )}
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
                    tick={{ fontFamily: "Poppins", fontSize: 11, fill: "#7a8086" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={160} interval={0}
                    tick={{ fontFamily: "Poppins", fontSize: 12, fill: "#585f66" }} axisLine={false} tickLine={false} />
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

export default function Timeline({ events, nextStep, startDate, endDate, onDateChange, onRegenerateNextStep }) {
  const [selected, setSelected]       = useState(null);
  const [activeType, setActiveType]   = useState(null);
  const [listExpanded, setListExpanded] = useState(true);

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

  // Chronological groups (oldest → newest) for the visual graph label
  const monthGroups = useMemo(() => groupByMonth(filtered), [filtered]);

  // Reversed groups (newest → oldest) for the collapsible card list
  const monthGroupsDesc = useMemo(
    () => [...monthGroups].reverse().map((m) => ({ ...m, events: [...m.events].reverse() })),
    [monthGroups]
  );

  const toggleType = (type) =>
    setActiveType((prev) => (prev === type ? null : type));

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── Date Filter ── */}
      <DateFilter startDate={startDate} endDate={endDate} onChange={onDateChange} embedded />

      {/* ── Type Filter ── */}
      <div style={{
        padding: "14px 32px", background: "#fff",
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
        borderBottom: "1px solid #f0f4fa",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#7a8086", marginRight: 6 }}>
          FILTER BY TYPE:
        </span>
        {Object.entries(TYPE_CONFIG)
          .filter(([key]) => key !== "nextStep")
          .map(([key, { color, label }]) => {
            const isActive = activeType === key;
            const isDimmed = activeType && activeType !== key;
            return (
              <button key={key} onClick={() => toggleType(key)} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                border: `1.5px solid ${isActive ? color : "#e8ecf0"}`,
                background: isActive ? color + "18" : "#fff",
                opacity: isDimmed ? 0.4 : 1,
                transition: "all 0.18s ease",
                fontFamily: "Poppins, sans-serif",
              }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? color : "#585f66", whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </button>
            );
          })}
        {activeType && (
          <button onClick={() => setActiveType(null)} style={{
            padding: "5px 12px", borderRadius: 20, border: "1.5px solid #dbdbdb",
            background: "#fff", cursor: "pointer",
            fontFamily: "Poppins, sans-serif", fontSize: 11, color: "#7a8086", fontWeight: 600,
          }}>
            ✕ Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#7a8086", fontSize: 14 }}>
          No sessions match the current filters.
        </div>
      ) : (
        <>
          {/* ── Visual Graph Timeline ── */}
          <div style={{ padding: "20px 32px 8px", borderBottom: "1px solid #f0f4fa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#7a8086", fontFamily: "Poppins, sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Journey Overview
              </span>
              <span style={{ fontSize: 12, color: "#7a8086", fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>
                {filtered.length} session{filtered.length !== 1 ? "s" : ""}
                {nextStep && <> · <span style={{ color: "#f57800" }}>1 upcoming</span></>}
              </span>
            </div>
            <VisualTimeline
              events={filtered}
              nextStep={nextStep}
              onEventClick={(item) => setSelected(item)}
            />
          </div>

          {/* ── Collapsible Session History ── */}
          <div>
            {/* Toggle header */}
            <button
              onClick={() => setListExpanded((p) => !p)}
              style={{
                width: "100%",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 32px",
                background: "#fff",
                border: "none",
                borderBottom: listExpanded ? "1px solid #f0f4fa" : "none",
                cursor: "pointer",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "#7a8086", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Session History
              </span>
              <span style={{ fontSize: 18, color: "#7a8086", lineHeight: 1 }}>
                {listExpanded ? "▾" : "▸"}
              </span>
            </button>

            {listExpanded && (
              <div style={{ padding: "8px 32px 32px", background: "#fff" }}>

                {/* Next Step at the very top (most "recent" / upcoming) */}
                {nextStep && (
                  <SpineRow dotColor="#ffb800" isFirst isLast={false} isDiamond>
                    <div
                      onClick={() => setSelected({ ...nextStep, _isNextStep: true })}
                      style={{
                        background: "linear-gradient(135deg, #fffbf0 0%, #fff3d6 100%)",
                        borderRadius: 12, padding: "14px 18px",
                        border: "2px solid #ffb800", borderLeft: "4px solid #f57800",
                        cursor: "pointer", transition: "box-shadow 0.18s, transform 0.12s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,184,0,0.25)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{
                          background: "#ffb80022", color: "#7a4800",
                          border: "1px solid #ffb80044", borderRadius: 999, padding: "3px 10px",
                          fontSize: 11, fontWeight: 700, fontFamily: "Poppins, sans-serif",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>⚡ Up Next</span>
                      </div>
                      <h3 style={{ fontFamily: '"Source Serif Pro", serif', fontSize: 17, fontWeight: 600, color: "#004266", margin: "0 0 8px" }}>
                        Coaching Compass
                      </h3>
                      <p style={{
                        fontFamily: "Poppins, sans-serif", fontSize: 13, color: "#585f66",
                        lineHeight: 1.6, margin: 0,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {stripMarkdown(nextStep.suggestion) || "Continue the coaching journey with Ally."}
                      </p>
                    </div>
                  </SpineRow>
                )}

                {/* Events: most recent month first, most recent event first within each month */}
                {monthGroupsDesc.map((month, mIdx) => {
                  const isLastMonth = mIdx === monthGroupsDesc.length - 1;
                  return (
                    <div key={month.key}>
                      {/* Month separator */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 12,
                        margin: "20px 0 4px", paddingLeft: 48,
                      }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: "#aab0b8",
                          textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap",
                        }}>
                          {month.label}
                        </span>
                        <div style={{ flex: 1, height: 1, background: "#e8ecf0" }} />
                      </div>

                      {/* Event cards */}
                      {month.events.map((event, eIdx) => {
                        const cfg       = TYPE_CONFIG[event.type] || TYPE_CONFIG["One on One Coaching"];
                        const topComps  = getTopCompetencies(event.signals);
                        const snippet   = event.takeaway || event.analysis || "";
                        const isFirst   = !nextStep && mIdx === 0 && eIdx === 0;
                        const isLast    = isLastMonth && eIdx === month.events.length - 1;

                        return (
                          <SpineRow key={event.id} dotColor={cfg.color} isFirst={isFirst} isLast={isLast}>
                            <div
                              onClick={() => setSelected(event)}
                              style={{
                                background: "#f9fbfd", borderRadius: 12, padding: "14px 18px",
                                border: "1px solid #eaeff5", borderLeft: `3px solid ${cfg.color}`,
                                cursor: "pointer", transition: "box-shadow 0.18s, transform 0.12s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,66,102,0.11)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span style={{
                                  background: cfg.color + "18", color: cfg.color,
                                  border: `1px solid ${cfg.color}44`, borderRadius: 999, padding: "3px 10px",
                                  fontSize: 11, fontWeight: 700, fontFamily: "Poppins, sans-serif",
                                  textTransform: "uppercase", letterSpacing: "0.06em",
                                }}>
                                  {cfg.label}
                                </span>
                                <span style={{ fontSize: 12, color: "#7a8086", fontWeight: 600, fontFamily: "Poppins, sans-serif" }}>
                                  {fmt(event.date)}
                                </span>
                              </div>
                              <h3 style={{ fontFamily: '"Source Serif Pro", serif', fontSize: 17, fontWeight: 600, color: "#004266", margin: "0 0 10px", lineHeight: 1.3 }}>
                                {event.name}
                              </h3>
                              {topComps.length > 0 && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: snippet ? 10 : 0 }}>
                                  {topComps.map((comp) => {
                                    const color = getCompetencyColor(comp);
                                    return (
                                      <span key={comp} style={{
                                        background: color + "15", color,
                                        border: `1px solid ${color}40`, borderRadius: 999, padding: "3px 10px",
                                        fontSize: 11, fontWeight: 600, fontFamily: "Poppins, sans-serif",
                                      }}>
                                        {COMPETENCY_SHORT[comp] || comp}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              {snippet && (
                                <p style={{
                                  fontFamily: "Poppins, sans-serif", fontSize: 13, color: "#585f66",
                                  lineHeight: 1.6, margin: 0,
                                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                }}>
                                  {snippet}
                                </p>
                              )}
                            </div>
                          </SpineRow>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <EventModal
        item={selected}
        onClose={() => setSelected(null)}
        onRegenerateNextStep={onRegenerateNextStep}
      />
    </div>
  );
}
