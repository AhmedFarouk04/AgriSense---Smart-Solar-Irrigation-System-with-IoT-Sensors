export default function DeviceDetails() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070d09",
        color: "#e8f5e9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans',system-ui,sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Device Details</div>
        <div
          style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 }}
        >
          Coming soon
        </div>
      </div>
    </div>
  );
}
