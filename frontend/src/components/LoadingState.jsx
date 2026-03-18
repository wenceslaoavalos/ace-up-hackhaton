export default function LoadingState({
  title = "Loading coaching journey",
  description = "Preparing the latest coaching data and insights.",
}) {
  return (
    <div
      style={{
        minHeight: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 8px 28px rgba(0,66,102,0.12)",
          padding: "40px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div
          className="app-spinner"
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "4px solid rgba(0,138,248,0.14)",
            borderTopColor: "#008af8",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: '"Source Serif Pro", serif',
              fontSize: 30,
              fontWeight: 700,
              color: "#343a40",
            }}
          >
            {title}
          </h2>

          <p
            style={{
              margin: 0,
              fontFamily: "Poppins, sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#6d7680",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
