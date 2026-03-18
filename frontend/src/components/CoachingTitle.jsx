export default function CoachingTitle({ name, company, program, totalSessions, startDate }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 3px 16px rgba(0,66,102,0.09)",
      padding: "36px 40px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      height: "100%",
      gap: 0,
    }}>
      {/* Name */}
      <p style={{
        fontFamily: "Poppins, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        color: "#7a8086",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        margin: "0 0 8px",
      }}>
        Coaching Journey
      </p>

      <h1 style={{
        fontFamily: '"Source Serif Pro", serif',
        fontSize: 38,
        fontWeight: 700,
        color: "#f57800",
        margin: "0 0 4px",
        lineHeight: 1.1,
      }}>
        {name}
      </h1>

      {/* Divider */}
      <div style={{
        width: 48,
        height: 3,
        background: "linear-gradient(to right, #008af8, #00d4ff)",
        borderRadius: 2,
        margin: "20px 0",
      }} />

      {/* Company + Program */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{
          background: "linear-gradient(to right, #008af8 35%, #00d4ff 101%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: '"Source Serif Pro", serif',
          fontSize: 20,
          fontWeight: 700,
        }}>
          {company}
        </span>
        <span style={{ color: "#dbdbdb", fontSize: 18 }}>·</span>
        <span style={{
          fontFamily: "Poppins, sans-serif",
          fontSize: 15,
          color: "#585f66",
          fontWeight: 500,
        }}>
          {program}
        </span>
      </div>

      {/* Stats row */}
      {(totalSessions || startDate) && (
        <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
          {totalSessions && (
            <div>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 700, color: "#008af8", margin: 0 }}>
                {totalSessions}
              </p>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 11, color: "#7a8086", margin: "2px 0 0", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Events
              </p>
            </div>
          )}
          {startDate && (
            <div>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 700, color: "#008af8", margin: 0 }}>
                {startDate}
              </p>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 11, color: "#7a8086", margin: "2px 0 0", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Program Start
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
