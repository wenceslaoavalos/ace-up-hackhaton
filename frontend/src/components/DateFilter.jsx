import { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const QUICK_FILTERS = [
  { key: "all", label: "All Time" },
  { key: "3m",  label: "3 Months" },
  { key: "1m",  label: "1 Month"  },
  { key: "2w",  label: "2 Weeks"  },
  { key: "1w",  label: "1 Week"   },
];

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

export default function DateFilter({ startDate, endDate, onChange, embedded = false }) {
  const [activeKey, setActiveKey]   = useState("all");
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef                   = useRef(null);

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyQuick = (key) => {
    setActiveKey(key);
    setShowPicker(false);
    if (key === "all") { onChange({ startDate: null, endDate: null }); return; }
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    if (key === "3m") start.setMonth(start.getMonth() - 3);
    if (key === "1m") start.setMonth(start.getMonth() - 1);
    if (key === "2w") start.setDate(start.getDate() - 14);
    if (key === "1w") start.setDate(start.getDate() - 7);
    onChange({ startDate: start, endDate: end });
  };

  const handleCalendarChange = ({ selection }) => {
    setActiveKey("custom");
    onChange({ startDate: selection.startDate, endDate: selection.endDate });
  };

  const defaultStart = new Date(2026, 0, 15);
  const defaultEnd   = new Date(2026, 4, 22);
  const rangeForPicker = [{
    startDate: startDate || defaultStart,
    endDate:   endDate   || defaultEnd,
    key: "selection",
  }];

  const fromLabel = fmtDate(startDate) || "Start date";
  const toLabel   = fmtDate(endDate)   || "End date";
  const hasCustom = activeKey === "custom";

  return (
    <div style={{
      background: embedded ? "transparent" : "#fff",
      borderRadius: embedded ? 0 : 14,
      boxShadow: embedded ? "none" : "0 3px 16px rgba(0,66,102,0.09)",
      padding: embedded ? "18px 32px 16px" : "14px 20px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    }}>

      {/* Quick filter chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{
          fontFamily: "Poppins, sans-serif",
          fontSize: 11, fontWeight: 600,
          color: "#7a8086", textTransform: "uppercase",
          letterSpacing: "0.07em", marginRight: 2,
        }}>
          Filter:
        </span>
        {QUICK_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => applyQuick(key)}
            style={{
              padding: "5px 13px",
              borderRadius: 20,
              border: `1.5px solid ${activeKey === key ? "#008af8" : "#e8ecf0"}`,
              background: activeKey === key ? "#008af8" : "#fff",
              color: activeKey === key ? "#fff" : "#585f66",
              fontSize: 12, fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Poppins, sans-serif",
              transition: "all 0.18s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 26, background: "#e8ecf0", flexShrink: 0 }} />

      {/* Date range inputs — open popup on click */}
      <div style={{ position: "relative" }} ref={pickerRef}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 6,
            cursor: "pointer",
          }}
          onClick={() => setShowPicker((v) => !v)}
        >
          {/* From */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px",
            borderRadius: 8,
            border: `1.5px solid ${showPicker || hasCustom ? "#008af8" : "#e8ecf0"}`,
            background: "#f9fbfd",
            fontFamily: "Poppins, sans-serif",
            fontSize: 12, color: startDate ? "#343a40" : "#7a8086",
            fontWeight: startDate ? 600 : 400,
            whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 13 }}>📅</span>
            {fromLabel}
          </div>

          <span style={{ color: "#7a8086", fontSize: 14, fontWeight: 700 }}>→</span>

          {/* To */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px",
            borderRadius: 8,
            border: `1.5px solid ${showPicker || hasCustom ? "#008af8" : "#e8ecf0"}`,
            background: "#f9fbfd",
            fontFamily: "Poppins, sans-serif",
            fontSize: 12, color: endDate ? "#343a40" : "#7a8086",
            fontWeight: endDate ? 600 : 400,
            whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 13 }}>📅</span>
            {toLabel}
          </div>
        </div>

        {/* Popup calendar */}
        {showPicker && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            zIndex: 200,
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 8px 40px rgba(0,66,102,0.18)",
            border: "1px solid #e8ecf0",
            overflow: "hidden",
          }}>
            <DateRange
              ranges={rangeForPicker}
              onChange={handleCalendarChange}
              months={2}
              direction="horizontal"
              rangeColors={["#008af8"]}
              showSelectionPreview
              moveRangeOnFirstSelection={false}
              showDateDisplay={false}
              weekStartsOn={1}
            />
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid #e8ecf0",
              display: "flex", justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setShowPicker(false)}
                style={{
                  padding: "6px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#008af8",
                  color: "#fff",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
