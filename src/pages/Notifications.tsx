import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Droplets,
  Power,
  Plus,
  Wifi,
  AlertTriangle,
  Info,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
  { x: 75, y: 40, size: 6, color: "var(--particle-3)", delay: 1.8 },
];

type AppEvent = {
  _id: string;
  _creationTime: number;
  userId: string;
  deviceId?: string;
  type: string;
  message: string;
  data?: any;
  timestamp: number;
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getEventStyle(type: string) {
  switch (type) {
    case "pump_control":
      return {
        icon: <Power size={16} />,
        color: "#4ade80",
        bg: "rgba(74,222,128,0.1)",
        border: "rgba(74,222,128,0.2)",
      };
    case "device_added":
      return {
        icon: <Plus size={16} />,
        color: "#38bdf8",
        bg: "rgba(56,189,248,0.1)",
        border: "rgba(56,189,248,0.2)",
      };
    case "low_moisture":
      return {
        icon: <Droplets size={16} />,
        color: "#f87171",
        bg: "rgba(248,113,113,0.1)",
        border: "rgba(248,113,113,0.2)",
      };
    case "connection_error":
      return {
        icon: <Wifi size={16} />,
        color: "#fbbf24",
        bg: "rgba(251,191,36,0.1)",
        border: "rgba(251,191,36,0.2)",
      };
    case "alert":
      return {
        icon: <AlertTriangle size={16} />,
        color: "#fbbf24",
        bg: "rgba(251,191,36,0.1)",
        border: "rgba(251,191,36,0.2)",
      };
    default:
      return {
        icon: <Info size={16} />,
        color: "#a3a3a3",
        bg: "rgba(163,163,163,0.08)",
        border: "rgba(163,163,163,0.15)",
      };
  }
}

export default function Notifications() {
  const events = useQuery(api.users.getEvents);
  const devices = useQuery(api.devices.getDevices);
  const [scrolled, setScrolled] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pump_control" | "device_added" | "alert"
  >("all");

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const filtered = ((events ?? []) as AppEvent[]).filter((e: AppEvent) =>
    filter === "all" ? true : e.type === filter,
  );

  const deviceMap = Object.fromEntries(
    (devices ?? []).map((d) => [d._id, d.name]),
  );

  const grouped = filtered.reduce(
    (acc: Record<string, AppEvent[]>, event: AppEvent) => {
      const date = new Date(event.timestamp).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    },
    {},
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
        radial-gradient(ellipse 120% 60% at 50% 0%, #162e1a 0%, #0d2318 30%, transparent 60%),
        radial-gradient(ellipse 80% 60% at 0% 50%, rgba(15,43,24,0.9) 0%, transparent 60%),
        radial-gradient(ellipse 80% 60% at 100% 50%, rgba(11,30,36,0.7) 0%, transparent 60%),
        radial-gradient(ellipse 100% 50% at 50% 100%, rgba(15,43,24,0.5) 0%, transparent 60%),
        #070d09
      `,
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          className="grid-pattern"
          style={{ position: "absolute", inset: 0, opacity: 0.4 }}
        />
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -18, 0], opacity: [0.25, 0.7, 0.25] }}
            transition={{
              duration: 5 + p.delay,
              repeat: Infinity,
              delay: p.delay,
            }}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(7,13,9,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(32px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(32px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
          transition: "all 0.35s ease",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => nav("/dashboard")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Bell size={15} style={{ color: "var(--brand-500)" }} />
                Notifications
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  letterSpacing: "0.04em",
                }}
              >
                {filtered.length} event{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <motion.a
            href="/dashboard"
            whileHover={{ scale: 1.02 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <AgriSenseLogo size={34} />
            <span
              className="fd grad-text"
              style={{ fontSize: 18, fontWeight: 900 }}
            >
              AgriSense
            </span>
          </motion.a>
        </div>
      </header>

      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          {[
            { key: "all", label: "All" },
            { key: "pump_control", label: "💧 Pump" },
            { key: "device_added", label: "➕ Zones" },
            { key: "alert", label: "⚠️ Alerts" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              style={{
                padding: "7px 16px",
                borderRadius: "var(--r-full)",
                border: `1px solid ${filter === f.key ? "var(--brand-500)" : "var(--border-card)"}`,
                background:
                  filter === f.key
                    ? "rgba(74,222,128,0.12)"
                    : "var(--glass-bg)",
                color:
                  filter === f.key ? "var(--brand-500)" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {events === undefined && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid rgba(255,255,255,0.1)",
                borderTopColor: "#4ade80",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {/* Empty */}
        {events !== undefined && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "80px 24px" }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔔</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              No notifications yet
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Events like pump controls and zone additions will appear here.
            </div>
          </motion.div>
        )}

        {/* Events grouped by date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {Object.entries(grouped).map(([date, evts], gi) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
            >
              {/* Date divider */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--border-base)",
                  }}
                />
                {date}
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--border-base)",
                  }}
                />
              </div>

              {/* Events */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(evts as AppEvent[]).map((event: AppEvent, i: number) => {
                  const evStyle = getEventStyle(event.type);
                  return (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${evStyle.border}`,
                        borderRadius: 14,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          flexShrink: 0,
                          background: evStyle.bg,
                          border: `1px solid ${evStyle.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: evStyle.color,
                        }}
                      >
                        {evStyle.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginBottom: 4,
                          }}
                        >
                          {event.message}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {event.deviceId && deviceMap[event.deviceId] && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--brand-500)",
                                fontWeight: 600,
                                background: "rgba(74,222,128,0.08)",
                                padding: "2px 8px",
                                borderRadius: 99,
                                border: "1px solid rgba(74,222,128,0.15)",
                              }}
                            >
                              📍 {deviceMap[event.deviceId]}
                            </span>
                          )}
                          <span
                            style={{ fontSize: 11, color: "var(--text-faint)" }}
                          >
                            {timeAgo(event.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Type badge */}
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: evStyle.color,
                          background: evStyle.bg,
                          border: `1px solid ${evStyle.border}`,
                          padding: "3px 8px",
                          borderRadius: 99,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          flexShrink: 0,
                        }}
                      >
                        {event.type.replace(/_/g, " ")}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
