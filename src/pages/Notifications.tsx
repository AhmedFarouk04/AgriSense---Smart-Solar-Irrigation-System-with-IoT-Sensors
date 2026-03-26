import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Droplets,
  Power,
  Plus,
  Wifi,
  AlertTriangle,
  Info,
  Trash2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const PARTICLES = [
  { x: 10, y: 20, size: 6, color: "var(--particle-1)", delay: 0 },
  { x: 80, y: 15, size: 4, color: "var(--particle-2)", delay: 1 },
  { x: 90, y: 70, size: 7, color: "var(--particle-1)", delay: 0.5 },
];

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
  const styles: Record<string, any> = {
    pump_control: {
      icon: <Power size={16} />,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.1)",
      border: "rgba(74,222,128,0.2)",
    },
    device_added: {
      icon: <Plus size={16} />,
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.1)",
      border: "rgba(56,189,248,0.2)",
    },
    low_moisture: {
      icon: <Droplets size={16} />,
      color: "#f87171",
      bg: "rgba(248,113,113,0.1)",
      border: "rgba(248,113,113,0.2)",
    },
    critical_alert: {
      icon: <Zap size={16} />,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.3)",
    },
    connection_error: {
      icon: <Wifi size={16} />,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.1)",
      border: "rgba(251,191,36,0.2)",
    },
    default: {
      icon: <Info size={16} />,
      color: "#a3a3a3",
      bg: "rgba(163,163,163,0.08)",
      border: "rgba(163,163,163,0.15)",
    },
  };
  return styles[type] || styles.default;
}

export default function Notifications() {
  const events = useQuery(api.users.getEvents);
  const devices = useQuery(api.devices.getDevices);
  const clearEvents = useMutation(api.users.clearEvents);
  const [scrolled, setScrolled] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (events && events.length > 0) {
      localStorage.setItem("lastViewedNotifications", Date.now().toString());
      window.dispatchEvent(new Event("notifications_viewed"));
    }
  }, [events]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const deviceMap = Object.fromEntries(
    (devices ?? []).map((d) => [d._id, d.name]),
  );

  const filtered = (events ?? []).filter((e: any) => {
    if (filter === "all") return true;
    if (filter === "pump_control") return e.type === "pump_control";
    if (filter === "device_added") return e.type === "device_added";

    if (filter === "alert") {
      return (
        e.type === "alert" ||
        e.type === "low_moisture" ||
        e.type.includes("error")
      );
    }

    return e.type === filter;
  });

  const grouped = filtered.reduce((acc: any, event: any) => {
    const date = new Date(event.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  return (
    <div
      style={{
        minHeight: "100vh",
        // ✅ التعديل هنا: إرجاع الخلفية المتدرجة
        background: `radial-gradient(ellipse 120% 60% at 50% 0%, #162e1a 0%, #0d2318 30%, transparent 60%), radial-gradient(ellipse 80% 60% at 0% 50%, rgba(15,43,24,0.9) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 100% 50%, rgba(11,30,36,0.7) 0%, transparent 60%), radial-gradient(ellipse 100% 50% at 50% 100%, rgba(15,43,24,0.5) 0%, transparent 60%), #070d09`,
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Background Decor */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <div
          className="grid-pattern"
          style={{ position: "absolute", inset: 0, opacity: 0.3 }}
        />
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, delay: p.delay }}
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

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(7,13,9,0.8)" : "transparent",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.1)" : "transparent"}`,
          padding: "12px 24px",
          transition: "0.3s",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => nav("/dashboard")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {" "}
              <Bell size={18} color="#4ade80" /> Notifications{" "}
            </h1>
          </div>
          <button
            onClick={() => clearEvents()}
            style={{
              background: "transparent",
              border: "none",
              color: "#f87171",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: events?.length ? 1 : 0.3,
            }}
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "30px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 30,
            overflowX: "auto",
            paddingBottom: 10,
          }}
        >
          {[
            { id: "all", label: "All Activity" },
            { id: "alert", label: "Alerts", icon: <AlertTriangle size={14} /> },
            {
              id: "pump_control",
              label: "Pump Logs",
              icon: <Power size={14} />,
            },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                whiteSpace: "nowrap",
                padding: "8px 16px",
                borderRadius: 12,
                border:
                  filter === f.id
                    ? "1px solid #4ade80"
                    : "1px solid rgba(255,255,255,0.1)",
                background:
                  filter === f.id
                    ? "rgba(74,222,128,0.1)"
                    : "rgba(255,255,255,0.03)",
                color: filter === f.id ? "#4ade80" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "0.2s",
              }}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {events === undefined ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "60px",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                border: "3px solid rgba(255,255,255,0.1)",
                borderTopColor: "#4ade80",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: "rgba(74,222,128,0.05)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={40} color="rgba(74,222,128,0.2)" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              All caught up!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              No new notifications in this category.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, evs]: any) => (
            <div key={date} style={{ marginBottom: 32 }}>
              <h3
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {date}{" "}
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,0.05)",
                  }}
                />
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {evs.map((e: any) => {
                  const s = getEventStyle(e.type);
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={e._id}
                      style={{
                        display: "flex",
                        gap: 16,
                        padding: "16px",
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${s.border}`,
                        borderRadius: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: s.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: s.color,
                          flexShrink: 0,
                        }}
                      >
                        {s.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            marginBottom: 6,
                            color: "rgba(255,255,255,0.9)",
                          }}
                        >
                          {e.message}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          {e.deviceId && (
                            <span
                              style={{
                                fontSize: 10,
                                background: "rgba(74,222,128,0.1)",
                                color: "#4ade80",
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontWeight: 700,
                              }}
                            >
                              📍 {deviceMap[e.deviceId]}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.3)",
                            }}
                          >
                            {timeAgo(e.timestamp)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
