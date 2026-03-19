import ReactMarkdown from "react-markdown";

export default function NextStepCard({ nextStep }) {
  if (!nextStep) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #fffbf0 0%, #fff3d6 100%)",
      border: "1.5px solid #ffb80028",
      borderRadius: 18,
      boxShadow: "0 3px 16px rgba(0,66,102,0.09)",
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
        fontSize: 12,
        fontWeight: 900,
        color: "#ffb800",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        margin: "0 0 18px",
      }}>
        ⚡ Up Next
      </p>

      {/* Content */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
        <div style={{
          width: 56, height: 56,
          background: "#ffb800",
          borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, flexShrink: 0,
          boxShadow: "0 4px 14px #ffb80044",
        }}>
          🎯
        </div>
        <div>
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
                    fontWeight: 500,
                    lineHeight: 1.7,
                    color: "#585f66",
                  }}
                >
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong style={{ color: "#343a40", fontWeight: 700 }}>
                  {children}
                </strong>
              ),
            }}
          >
            {nextStep.suggestion || nextStep.name || "Continue the coaching journey with Ally."}
          </ReactMarkdown>
          <button
            type="button"
            style={{
              marginTop: 18,
              background: "#fff",
              color: "#008af8",
              border: "1px solid #cfe7fb",
              borderRadius: 999,
              padding: "10px 18px",
              fontFamily: "Poppins, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 8px 18px rgba(0,66,102,0.12)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#eaf5ff";
              e.currentTarget.style.borderColor = "#9fd0fb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#cfe7fb";
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
        width: 48, height: 3,
        background: "linear-gradient(to right, #ffb800, #f57800)",
        borderRadius: 2,
        marginTop: 24,
      }} />
    </div>
  );
}
