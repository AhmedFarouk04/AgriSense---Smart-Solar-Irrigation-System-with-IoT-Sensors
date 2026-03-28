import React from "react";

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)", // ✅
        border: "1px solid var(--border-card)", // ✅
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 12,
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          color: "var(--text-faint)", // ✅
          marginBottom: 4,
        }}
      >
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
