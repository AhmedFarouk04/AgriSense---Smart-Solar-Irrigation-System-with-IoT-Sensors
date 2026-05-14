import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
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
  Trash2,
  CheckCircle2,
  Zap,
  Sprout,
  Thermometer,
  WifiOff,
} from "lucide-react";

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

function formatDataKey(key: string) {
  const map: Record<string, string> = {
    cropName: "Crop",
    weekNumber: "Week",
    cropWeekAtSetup: "Crop Week At Setup",
    weeksLabel: "Week Range",
    applicationTiming: "Phase",
    criticalRemarks: "Remarks",
    nutrientSummary: "Fertilizer",
    wateringFrequency: "Watering",
    zoneAreaM2: "Zone Area m2",
    nutrientKgPerFed: "Nutrients kg/fed",
    zoneDoseKg: "Zone Dose kg",
    lastIrrigationAt: "Last Irrigation",
    nextIrrigationAt: "Next Irrigation",
    nextReviewAt: "Next Review",
    nextCheckAt: "Next Check",
    recommendedEndAt: "Recommended End",
    expectedEndAt: "Expected End",
    fertilizationStartedAt: "Fertilization Start",
    stoppedAt: "Actual End",
    plannedDurationMinutes: "Planned Duration min",
    durationMinutes: "Duration min",
    recommendedAction: "Recommended Action",
    runtimeMinutes: "Runtime min",
    moisture: "Moisture",
    temperature: "Temp C",
    flowRate: "Flow L/min",
  };
  return map[key] ?? key;
}

function formatDataValue(key: string, value: unknown) {
  if (value === undefined || value === null) return "-";

  if (
    typeof value === "number" &&
    (key.endsWith("At") || key.toLowerCase().includes("timestamp"))
  ) {
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  if (
    typeof value === "object" &&
    value !== null &&
    (key === "nutrientKgPerFed" || key === "zoneDoseKg")
  ) {
    const values = value as Record<string, number>;
    return `N:${values.nitrogen ?? 0}, P:${values.phosphorus ?? 0}, K:${values.potassium ?? 0}, Ca:${values.calcium ?? 0}, Mg:${values.magnesium ?? 0}`;
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getEventStyle(type: string) {
  const styles: Record<string, any> = {
    valve_control: {
      icon: <Power size={16} />,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.1)",
      border: "rgba(74,222,128,0.2)",
    },
    pump_control: {
      icon: <Power size={16} />,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.1)",
      border: "rgba(74,222,128,0.2)",
    },
    irrigation_started: {
      icon: <Droplets size={16} />,
      color: "#06b6d4",
      bg: "rgba(6,182,212,0.12)",
      border: "rgba(6,182,212,0.25)",
    },
    irrigation_stopped: {
      icon: <Power size={16} />,
      color: "#22d3ee",
      bg: "rgba(34,211,238,0.12)",
      border: "rgba(34,211,238,0.28)",
    },
    high_temperature: {
      icon: <Thermometer size={16} />,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.35)",
    },
    moisture_recovered: {
      icon: <Droplets size={16} />,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.28)",
    },
    temp_recovered: {
      icon: <Thermometer size={16} />,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.28)",
    },
    zone_status: {
      icon: <Wifi size={16} />,
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.12)",
      border: "rgba(96,165,250,0.28)",
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
    fertilizer_plan: {
      icon: <Sprout size={16} />,
      color: "#22d3ee",
      bg: "rgba(34,211,238,0.12)",
      border: "rgba(34,211,238,0.28)",
    },
    fertilization_started: {
      icon: <Sprout size={16} />,
      color: "#a3e635",
      bg: "rgba(163,230,53,0.14)",
      border: "rgba(163,230,53,0.30)",
    },
    fertilization_completed: {
      icon: <CheckCircle2 size={16} />,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.28)",
    },
    fertilization_safety_stop: {
      icon: <AlertTriangle size={16} />,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.35)",
    },
    irrigation_safety_stop: {
      icon: <AlertTriangle size={16} />,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.35)",
    },
    critical_escalation: {
      icon: <Zap size={16} />,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.35)",
    },
    weekly_agronomy_plan: {
      icon: <Sprout size={16} />,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.28)",
    },
    tank_empty_suspected: {
      icon: <AlertTriangle size={16} />,
      color: "#f97316",
      bg: "rgba(249,115,22,0.12)",
      border: "rgba(249,115,22,0.28)",
    },
    low_flow_warning: {
      icon: <AlertTriangle size={16} />,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.15)",
      border: "rgba(251,191,36,0.35)",
    },
    flow_recovered: {
      icon: <Droplets size={16} />,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.28)",
    },
    alert: {
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
  const markViewed = useMutation(api.users.markNotificationsViewed);
  const [scrolled, setScrolled] = useState(false);
  const [filter, setFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(50);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (events && events.length > 0) {
      localStorage.setItem("lastViewedNotifications", Date.now().toString());
      window.dispatchEvent(new Event("notifications_viewed"));
      markViewed({}).catch(() => {});
    }
  }, [events, markViewed]);

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

    if (filter === "alert") {
      return (
        e.type === "alert" ||
        e.type === "low_moisture" ||
        e.type === "moisture_recovered" ||
        e.type === "tank_empty_suspected" ||
        e.type === "low_flow_warning" ||
        e.type === "flow_recovered" ||
        e.type === "critical_escalation" ||
        e.type === "fertilization_safety_stop" ||
        e.type === "irrigation_safety_stop" ||
        e.type === "high_temperature" ||
        e.type === "temp_recovered" ||
        e.type.includes("error")
      );
    }

    if (filter === "operations") {
      return [
        "pump_control",
        "valve_control",
        "irrigation_started",
        "irrigation_stopped",
        "zone_status",
      ].includes(e.type);
    }

    if (filter === "plans") {
      return [
        "weekly_agronomy_plan",
        "fertilizer_plan",
        "fertilization_started",
      ].includes(e.type);
    }

    return e.type === filter;
  });

  const visibleFiltered = filtered.slice(0, visibleCount);

  const grouped = visibleFiltered.reduce((acc: any, event: any) => {
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
        background: "var(--bg-main-gradient)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
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

      {/* Offline Banner */}
      {isOffline && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "#ef4444",
            color: "white",
            zIndex: 9999,
            padding: "8px",
            textAlign: "center",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <WifiOff size={16} /> Connection Lost. Displaying offline data.
        </div>
      )}

      <header
        className="header-container"
        style={{
          position: "sticky",
          top: isOffline ? 36 : 0,
          zIndex: 100,
          background: scrolled ? "var(--bg-nav)" : "transparent",
          backdropFilter: scrolled ? "blur(32px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(32px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
          transition: "all 0.35s ease",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="header-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => nav("/dashboard")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                color: "var(--text-muted)",
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
                color: "var(--text-primary)",
              }}
            >
              <Bell size={18} color="var(--brand-500)" /> Notifications
            </h1>
          </div>
          <button
            className="header-actions"
            onClick={() => clearEvents()}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--error-color)",
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
          maxWidth: 900,
          margin: "0 auto",
          padding: "30px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 30,
            overflowX: "auto",
            paddingBottom: 10,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {[
            { id: "all", label: "All" },
            { id: "alert", label: "Alerts", icon: <AlertTriangle size={14} /> },
            {
              id: "operations",
              label: "Operations",
              icon: <Power size={14} />,
            },
            { id: "plans", label: "Plans", icon: <Sprout size={14} /> },
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
                    ? `1px solid var(--brand-500)`
                    : `1px solid var(--border-card)`,
                background: filter === f.id ? "var(--glass-bg)" : "transparent",
                color:
                  filter === f.id ? "var(--brand-500)" : "var(--text-faint)",
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
                border: "3px solid var(--border-card)",
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
                background: "var(--glass-bg)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2
                size={40}
                color="var(--brand-500)"
                style={{ opacity: 0.3 }}
              />
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
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {date}
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--border-base)",
                  }}
                />
              </h3>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {evs.map((e: any) => {
                  const s = getEventStyle(e.type);

                  const hiddenKeys = [
                    "detailedMessage",
                    "nutrientSummary",
                    "durationMinutes",
                    "flowRate",
                    "moisture",
                    "temperature",
                    "suppressToast",
                    "displayMode",
                    "source",
                    "isSimulation",
                  ];

                  if (
                    (e.data?.stopReason &&
                      e.data.stopReason !== "max_duration" &&
                      e.data.stopReason !== "completed") ||
                    e.type === "fertilization_stopped" ||
                    e.type === "fertilization_safety_stop"
                  ) {
                    hiddenKeys.push("expectedEndAt", "recommendedEndAt");
                  }

                  const otherDataEntries = Object.entries(e.data ?? {}).filter(
                    ([k, v]) =>
                      v !== undefined && v !== null && !hiddenKeys.includes(k),
                  );

                  const hasDetails =
                    e.data?.detailedMessage ||
                    e.data?.nutrientSummary ||
                    otherDataEntries.length > 0;

                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={e._id}
                      style={{
                        display: "flex",
                        gap: 16,
                        padding: "16px",
                        background: "var(--bg-card)",
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
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            marginBottom: 8,
                          }}
                        >
                          {(e.message || "")
                            .split("\n")
                            .map((line: string, idx: number) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: idx === 0 ? 14 : 12,
                                  fontWeight: idx === 0 ? 700 : 500,
                                  color:
                                    idx === 0
                                      ? "var(--text-primary)"
                                      : "var(--text-faint)",
                                }}
                              >
                                {line}
                              </span>
                            ))}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: e.data ? 12 : 0,
                          }}
                        >
                          {e.deviceId && (
                            <span
                              style={{
                                fontSize: 10,
                                background: "var(--success-bg)",
                                color: "#4ade80",
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontWeight: 700,
                              }}
                            >
                              Zone: {deviceMap[e.deviceId]}
                            </span>
                          )}
                          <span
                            style={{ fontSize: 11, color: "var(--text-faint)" }}
                          >
                            {timeAgo(e.timestamp)}
                          </span>
                        </div>

                        {e.data && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            {e.data.durationMinutes !== undefined && (
                              <span
                                style={{
                                  fontSize: 11,
                                  background: "var(--glass-bg)",
                                  border: "1px solid var(--border-card)",
                                  color: "var(--text-primary)",
                                  padding: "4px 8px",
                                  borderRadius: 8,
                                  fontWeight: 600,
                                }}
                              >
                                ⏱ {e.data.durationMinutes} min
                              </span>
                            )}
                            {e.data.flowRate !== undefined && (
                              <span
                                style={{
                                  fontSize: 11,
                                  background: "var(--glass-bg)",
                                  border: "1px solid var(--border-card)",
                                  color: "var(--text-primary)",
                                  padding: "4px 8px",
                                  borderRadius: 8,
                                  fontWeight: 600,
                                }}
                              >
                                💧 {e.data.flowRate} L/min
                              </span>
                            )}
                            {e.data.moisture !== undefined && (
                              <span
                                style={{
                                  fontSize: 11,
                                  background: "var(--glass-bg)",
                                  border: "1px solid var(--border-card)",
                                  color: "var(--text-primary)",
                                  padding: "4px 8px",
                                  borderRadius: 8,
                                  fontWeight: 600,
                                }}
                              >
                                🌱 Moisture: {e.data.moisture}%
                              </span>
                            )}
                            {e.data.temperature !== undefined && (
                              <span
                                style={{
                                  fontSize: 11,
                                  background: "var(--glass-bg)",
                                  border: "1px solid var(--border-card)",
                                  color: "var(--text-primary)",
                                  padding: "4px 8px",
                                  borderRadius: 8,
                                  fontWeight: 600,
                                }}
                              >
                                🌡️ Temp: {e.data.temperature}°C
                              </span>
                            )}
                            {e.data.isSimulation && (
                              <span
                                style={{
                                  fontSize: 11,
                                  background: "rgba(245, 158, 11, 0.1)",
                                  border: "1px solid rgba(245, 158, 11, 0.2)",
                                  color: "#d97706",
                                  padding: "4px 8px",
                                  borderRadius: 8,
                                  fontWeight: 700,
                                }}
                              >
                                🧪 Test / Simulation
                              </span>
                            )}
                          </div>
                        )}

                        {hasDetails && (
                          <details style={{ marginTop: 12 }}>
                            <summary
                              style={{
                                fontSize: 12,
                                color: "var(--brand-500)",
                                fontWeight: 700,
                                cursor: "pointer",
                                userSelect: "none",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              Show Details
                            </summary>
                            <div
                              style={{
                                marginTop: 12,
                                padding: 16,
                                background: "var(--glass-bg)",
                                border: "1px solid var(--border-card)",
                                borderRadius: 12,
                                fontSize: 12,
                                color: "var(--text-secondary)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                              }}
                            >
                              {e.data.detailedMessage && (
                                <p
                                  style={{
                                    lineHeight: 1.6,
                                    color: "var(--text-primary)",
                                    fontSize: 13,
                                  }}
                                >
                                  {e.data.detailedMessage}
                                </p>
                              )}
                              {e.data.nutrientSummary && (
                                <div
                                  style={{
                                    paddingTop: 12,
                                    borderTop: "1px solid var(--border-base)",
                                    fontFamily: "monospace",
                                    color: "var(--text-faint)",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  <strong
                                    style={{
                                      color: "var(--text-muted)",
                                      display: "block",
                                      marginBottom: 4,
                                    }}
                                  >
                                    Dose:
                                  </strong>
                                  {e.data.nutrientSummary}
                                </div>
                              )}
                              {otherDataEntries.length > 0 && (
                                <div
                                  style={{
                                    marginTop: 8,
                                    paddingTop: 16,
                                    borderTop:
                                      "1px solid rgba(255,255,255,0.05)",
                                    display: "grid",
                                    gridTemplateColumns:
                                      "repeat(auto-fit, minmax(140px, 1fr))",
                                    gap: 16,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {otherDataEntries.map(([k, v]) => (
                                    <div
                                      key={k}
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 3,
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "var(--text-faint)",
                                          fontSize: 11,
                                          textTransform: "uppercase",
                                          letterSpacing: "0.02em",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {formatDataKey(k)}
                                      </span>
                                      <span
                                        style={{
                                          color: "var(--text-primary)",
                                          fontSize: 13,
                                          fontWeight: 500,
                                        }}
                                      >
                                        {formatDataValue(k, v)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {filtered.length > visibleCount && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button
              onClick={() => setVisibleCount((prev) => prev + 50)}
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                color: "var(--text-primary)",
                padding: "10px 24px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              Load More ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
