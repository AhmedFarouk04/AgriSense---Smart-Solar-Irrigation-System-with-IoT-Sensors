import React from "react";
import { motion } from "framer-motion";
import { GaugeRing } from "./GaugeRing";

export function LiveCard({
  icon,
  label,
  value,
  unit,
  status,
  color,
  max,
  delay,
  isLoading = false, // ✅ ضفنا ده للـ Feedback
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  status: { label: string; color: string };
  color: string;
  max: number;
  delay: number;
  isLoading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        overflow: "hidden",
        opacity: isLoading ? 0.7 : 1, // تأثير شفافية لو بيحمل
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}18, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          {isLoading ? (
            <div
              style={{
                width: 16,
                height: 16,
                border: `2px solid ${color}40`,
                borderTopColor: color,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            icon
          )}
        </div>
        <GaugeRing value={value} max={max} color={color} size={52} />
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#e8f5e9",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {value.toFixed(1)}
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.4)",
              marginLeft: 3,
            }}
          >
            {unit}
          </span>
        </div>
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          borderRadius: 99,
          background: `${status.color}15`,
          border: `1px solid ${status.color}30`,
          width: "fit-content",
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: status.color,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: status.color }}>
          {status.label}
        </span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
