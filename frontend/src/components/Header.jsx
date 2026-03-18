export default function Header() {
  return (
    <header
      style={{
        background: "linear-gradient(to right, #008af8 35%, #00d4ff 101%)",
        padding: "18px 36px",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 2px 12px rgba(0,138,248,0.35)",
      }}
    >
      <img
        src="https://ace-up-www.s3.amazonaws.com/assets/new_logo/aceup_logo_white.svg"
        alt="AceUp"
        style={{ display: "block", height: 40, width: "auto" }}
      />
    </header>
  );
}
