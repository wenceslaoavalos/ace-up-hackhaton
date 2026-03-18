import { useState } from "react";
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

export default function DateFilter({ startDate, endDate, onChange }) {
  const [activeKey, setActiveKey] = useState("all");

  const applyQuick = (key) => {
    setActiveKey(key);
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

  // DateRangePicker always needs a valid Date
  const defaultStart = new Date(2026, 0, 15);  // Jan 15 2026
  const defaultEnd   = new Date(2026, 4, 22);  // May 22 2026
  const rangeForPicker = [{
    startDate: startDate || defaultStart,
    endDate:   endDate   || defaultEnd,
    key: "selection",
  }];

  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 3px 16px rgba(0,66,102,0.09)",
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h3 style={{
          fontFamily: '"Source Serif Pro", serif',
          fontSize: 18, fontWeight: 600,
          color: "#343a40", margin: 0,
        }}>
          Filter by Date
        </h3>

        {/* Quick filter chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {QUICK_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => applyQuick(key)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: `1.5px solid ${activeKey === key ? "#008af8" : "#dbdbdb"}`,
                background: activeKey === key ? "#008af8" : "#fff",
                color: activeKey === key ? "#fff" : "#585f66",
                fontSize: 12, fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Poppins, sans-serif",
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar — always open */}
      <div style={{ overflow: "hidden", width: "100%" }}>
        <DateRange
          ranges={rangeForPicker}
          onChange={handleCalendarChange}
          months={1}
          direction="horizontal"
          rangeColors={["#008af8"]}
          showSelectionPreview
          moveRangeOnFirstSelection={false}
          showDateDisplay={false}
          weekStartsOn={1}
        />
      </div>
    </div>
  );
}
