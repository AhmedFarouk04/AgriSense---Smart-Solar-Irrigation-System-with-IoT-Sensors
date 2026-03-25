import React from "react";

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f1f12",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 12,
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
        {label}
      </div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {Number(p.value).toFixed(1)} {p.unit || ""}
        </div>
      ))}
    </div>
  );
};
