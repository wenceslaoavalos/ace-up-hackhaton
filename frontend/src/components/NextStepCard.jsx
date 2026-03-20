import ReactMarkdown from "react-markdown";
import { getCompetencyColor } from "../utils/competencyColors";

export default function NextStepCard({ nextStep }) {
  if (!nextStep) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #fffbf0 0%, #fff3d6 100%)",
      border: "2px solid #ffb800",
      borderLeft: "4px solid #f57800",
      borderRadius: 18,
      boxShadow: "0 6px 28px rgba(255,184,0,0.22)",
      padding: "36px 40px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      height: "100%",
      gap: 0,
    }}>
      {/* Label */}
      <p style={{
        fontFamily: "Poppins, sans-serif",
        fontSize: 13,
        fontWeight: 900,
        color: "#7a4800",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        margin: "0 0 18px",
        background: "#ffb80022",
        borderRadius: 6,
        padding: "2px 10px",
        display: "inline-block",
      }}>
        ⚡ Up Next
      </p>

      {/* Content */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
        <div
          className="ns-icon"
          style={{
            width: 56, height: 56,
            background: "#ffb800",
            borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Compass circle */}
            <circle cx="12" cy="12" r="9.5" stroke="#fff" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="1.5" fill="#fff"/>
            {/* North needle (pointing up-right, white) */}
            <polygon points="12,12 14.5,5 12,7.5" fill="#fff"/>
            {/* South needle (pointing down-left, semi-transparent) */}
            <polygon points="12,12 9.5,19 12,16.5" fill="rgba(255,255,255,0.45)"/>
            {/* Cardinal tick marks */}
            <line x1="12" y1="3" x2="12" y2="4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="19.5" x2="12" y2="21" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="3" y1="12" x2="4.5" y2="12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="19.5" y1="12" x2="21" y2="12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{
            fontFamily: '"Source Serif Pro", serif',
            fontSize: 22, fontWeight: 700,
            color: "#004266",
            margin: "0 0 10px",
            lineHeight: 1.25,
          }}>
            Coaching Compass
          </h2>
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p
                  style={{
                    margin: 0,
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: 1.75,
                    color: "#343a40",
                  }}
                >
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong style={{ color: "#004266", fontWeight: 700 }}>
                  {children}
                </strong>
              ),
            }}
          >
            {nextStep.suggestion || nextStep.name || "Continue the coaching journey with Ally."}
          </ReactMarkdown>

          {/* Related competency badges */}
          {nextStep.related_competencies?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {nextStep.related_competencies.map((comp) => {
                const color = getCompetencyColor(comp);
                return (
                  <span
                    key={comp}
                    style={{
                      background: color + "18",
                      color: color,
                      border: `1px solid ${color}44`,
                      borderRadius: 999,
                      padding: "4px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "Poppins, sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      maxWidth: 220,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {comp}
                  </span>
                );
              })}
            </div>
          )}

          {/* Based-on events footnote */}
          {nextStep.based_on_events?.length > 0 && (
            <p style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: 11,
              color: "#7a8086",
              marginTop: 10,
              marginBottom: 0,
            }}>
              Based on: {nextStep.based_on_events.map((e) => typeof e === "string" ? e : e.name).join(" · ")}
            </p>
          )}

          <button
            type="button"
            style={{
              marginTop: 18,
              background: "linear-gradient(135deg, #008af8 0%, #0070d0 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "12px 24px",
              fontFamily: "Poppins, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(0,138,248,0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #0070d0 0%, #005bb5 100%)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,138,248,0.50)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #008af8 0%, #0070d0 100%)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,138,248,0.35)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <img
              src="/img/ally_icon.svg"
              alt="AceUp Ally"
              style={{ width: 20, height: 20, display: "block" }}
            />
            Chat with Ally
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        width: "100%", height: 2,
        background: "linear-gradient(to right, #ffb800, #f57800)",
        borderRadius: 2,
        marginTop: 24,
      }} />
    </div>
  );
}
