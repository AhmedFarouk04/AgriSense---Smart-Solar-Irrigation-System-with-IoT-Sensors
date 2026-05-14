import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AgriSenseLogo } from "../Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        textAlign: "center",
        padding: "40px 24px",
        position: "relative",
      }}
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ marginBottom: 36, position: "relative", zIndex: 1 }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "var(--badge-bg)",
            border: "1px solid var(--badge-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            filter:
              "drop-shadow(0 24px 60px rgba(74,222,128,0.35)) drop-shadow(0 6px 16px rgba(56,189,248,0.20))",
          }}
        >
          <AgriSenseLogo size={90} />
        </div>
      </motion.div>

      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: 12,
          letterSpacing: "-0.025em",
          position: "relative",
          zIndex: 1,
        }}
      >
        Welcome! Let's get your farm online 🌱
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: 15,
          marginBottom: 32,
          maxWidth: 380,
          position: "relative",
          zIndex: 1,
        }}
      >
        Add your first zone to start monitoring soil moisture, temperature, and
        water flow in real-time.
      </p>
      <motion.button
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{
          scale: 1.05,
          boxShadow:
            "0 0 0 6px rgba(74,222,128,0.16), 0 14px 34px rgba(34,211,238,0.33)",
        }}
        whileTap={{ scale: 0.97 }}
        onClick={() => nav("/add-zone")}
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 34px",
          borderRadius: 999,
          border: "1px solid rgba(125,211,252,0.45)",
          background: "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)",
          color: "#062a18",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          boxShadow:
            "0 0 0 1px rgba(74,222,128,0.12), 0 10px 26px rgba(74,222,128,0.35)",
          cursor: "pointer",
        }}
      >
        <Plus size={18} /> Add Your First Zone
      </motion.button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          maxWidth: 560,
          marginTop: 48,
          position: "relative",
          zIndex: 1,
        }}
      >
        {[
          {
            icon: "💧",
            title: "Live Soil Data",
            desc: "Monitor moisture & temperature in real-time",
          },
          {
            icon: "⚡",
            title: "Valve Control",
            desc: "Open/close irrigation valve remotely",
          },
          {
            icon: "📊",
            title: "Usage History",
            desc: "Track water usage over time with charts",
          },
        ].map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="glass-card"
            style={{ padding: "18px 16px", textAlign: "center" }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{h.icon}</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              {h.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              {h.desc}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

