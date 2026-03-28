import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Settings, Plus } from "lucide-react";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

export function DeviceSelector({
  devices,
  selectedId,
  onSelect,
}: {
  devices: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = devices.find((d) => d._id === selectedId);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {/* ── Trigger Button ── */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "var(--glass-bg)", // ✅
          border: "1px solid var(--border-card)", // ✅
          borderRadius: 12,
          color: "var(--text-primary)", // ✅
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          minWidth: 160,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: selected?.isActive ? "#4ade80" : "#6b7280",
            }}
          />
          {selected?.name ?? "Select Zone"}
        </div>
        <ChevronDown size={14} style={{ opacity: 0.5 }} />
      </button>

      {/* ── Settings Button ── */}
      {selectedId && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => nav(`/device-settings?id=${selectedId}`)}
          title="Zone Settings"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--glass-bg)", // ✅
            border: "1px solid var(--border-card)", // ✅
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-faint)", // ✅
            transition: "all 0.2s",
          }}
        >
          <Settings size={15} />
        </motion.button>
      )}

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              background: "var(--bg-card)", // ✅
              border: "1px solid var(--border-card)", // ✅
              borderRadius: 12,
              overflow: "hidden",
              zIndex: 50,
              minWidth: 200,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
          >
            {devices.map((d) => (
              <button
                key={d._id}
                onClick={() => {
                  onSelect(d._id);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background:
                    d._id === selectedId
                      ? "rgba(74,222,128,0.08)"
                      : "transparent",
                  border: "none",
                  color: "var(--text-primary)", // ✅
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: d.isActive ? "#4ade80" : "#6b7280",
                      flexShrink: 0,
                    }}
                  />
                  {d.name}
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    nav(`/device-settings?id=${d._id}`);
                    setOpen(false);
                  }}
                  style={{
                    padding: 4,
                    borderRadius: 6,
                    color: "var(--text-faint)", // ✅
                    cursor: "pointer",
                  }}
                >
                  <Settings size={13} />
                </motion.div>
              </button>
            ))}

            {/* Add Zone button */}
            <button
              onClick={() => {
                nav("/add-zone");
                setOpen(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                borderTop: "1px solid var(--border-card)", // ✅
                color: "var(--brand-500)", // ✅
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={13} /> Add Zone
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
