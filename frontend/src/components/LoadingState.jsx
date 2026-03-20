export default function LoadingState({
  title = "Loading coaching journey",
  description = "Preparing the latest coaching data and insights.",
}) {
  return (
    <div
      style={{
        minHeight: "78vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(150deg, #eef6ff 0%, #f9fbfd 55%, #fff8f2 100%)",
        borderRadius: 18,
        padding: "48px 24px",
        animation: "ls-fade-in 0.5s ease both",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 0,
        }}
      >
        {/* ── Orbit animation ── */}
        <div style={{ position: "relative", width: 128, height: 128, marginBottom: 36 }}>

          {/* Outer ring — clockwise */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            border: "2.5px solid transparent",
            borderTopColor: "#008af8",
            borderRightColor: "#00d4ff",
            animation: "ls-spin-cw 1.8s linear infinite",
          }} />

          {/* Middle ring — counter-clockwise */}
          <div style={{
            position: "absolute", inset: 14,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#f57800",
            borderLeftColor: "#ffb800",
            animation: "ls-spin-ccw 1.3s linear infinite",
          }} />

          {/* Center badge */}
          <div style={{
            position: "absolute", inset: 30,
            background: "#fff",
            borderRadius: "50%",
            boxShadow: "0 4px 22px rgba(0,138,248,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9.5" stroke="#008af8" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="1.5" fill="#008af8" />
              <polygon points="12,12 14.5,5 12,7.5" fill="#008af8" />
              <polygon points="12,12 9.5,19 12,16.5" fill="rgba(0,138,248,0.35)" />
              <line x1="12" y1="3"    x2="12" y2="4.5"  stroke="#008af8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="19.5" x2="12" y2="21"   stroke="#008af8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="3"  y1="12"   x2="4.5" y2="12"  stroke="#008af8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="19.5" y1="12" x2="21" y2="12"   stroke="#008af8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* ── Title ── */}
        <h2
          style={{
            margin: "0 0 10px",
            fontFamily: '"Source Serif Pro", serif',
            fontSize: 30,
            fontWeight: 700,
            color: "#004266",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>

        {/* ── Description ── */}
        <p
          style={{
            margin: "0 0 28px",
            fontFamily: "Poppins, sans-serif",
            fontSize: 14,
            lineHeight: 1.65,
            color: "#7a8086",
            maxWidth: 320,
          }}
        >
          {description}
        </p>

        {/* ── Bouncing dots ── */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 9, height: 9,
                borderRadius: "50%",
                background: i === 1 ? "#f57800" : "#008af8",
                animation: "ls-dot-bounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
