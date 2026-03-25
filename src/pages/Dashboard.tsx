import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Droplets,
  Thermometer,
  Wind,
  Power,
  Wifi,
  WifiOff,
  Clock,
  Activity,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { AgriSenseLogo } from "../components/Logo";

// ✅ استدعاء المكونات المنفصلة
import { CustomTooltip } from "../components/dashboard/CustomTooltip";
import { LiveCard } from "../components/dashboard/LiveCard";
import { EmptyState } from "../components/dashboard/EmptyState";
import { DeviceSelector } from "../components/dashboard/DeviceSelector";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 6, y: 70, size: 6, color: "var(--particle-3)", delay: 1.5 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
  { x: 50, y: 90, size: 5, color: "var(--particle-2)", delay: 2 },
  { x: 20, y: 85, size: 4, color: "var(--particle-1)", delay: 1.2 },
  { x: 75, y: 40, size: 6, color: "var(--particle-3)", delay: 1.8 },
];

function getMoistureStatus(v: number) {
  if (v < 30) return { label: "Dry", color: "#f87171" };
  if (v < 70) return { label: "Good", color: "#4ade80" };
  return { label: "Wet", color: "#60a5fa" };
}

function getTempStatus(v: number) {
  if (v < 15) return { label: "Cold", color: "#60a5fa" };
  if (v < 35) return { label: "Normal", color: "#4ade80" };
  return { label: "Hot", color: "#f87171" };
}

function getFlowStatus(v: number) {
  if (v === 0) return { label: "Stopped", color: "#6b7280" };
  if (v < 2) return { label: "Low", color: "#fbbf24" };
  return { label: "Flowing", color: "#4ade80" };
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function DashboardContent({ deviceId }: { deviceId: Id<"devices"> }) {
  const latest = useQuery(api.readings.getLatestReading, { deviceId });
  const readings24h = useQuery(api.readings.getReadings24h, { deviceId });
  const fetchReading = useAction(api.readings.fetchAndSaveReading);
  const controlPump = useAction(api.readings.controlPump);
  const [pumpLoading, setPumpLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      await fetchReading({ deviceId });
    } catch {}
  }, [deviceId, fetchReading]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handlePump = async () => {
    if (!latest) return;
    setPumpLoading(true);
    try {
      await controlPump({ deviceId, state: !latest.pumpStatus });
      await refresh();
      toast.success(`Pump ${!latest.pumpStatus ? "started" : "stopped"}`);
    } catch {
      toast.error("Failed to control pump");
    } finally {
      setPumpLoading(false);
    }
  };

  const chartData = (readings24h ?? []).map((r) => ({
    time: fmt(r.timestamp),
    moisture: r.moisture,
    temperature: r.temperature,
    flow: r.flowRate,
  }));

  if (latest === undefined || readings24h === undefined) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 400,
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
    );
  }

  if (!latest) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ textAlign: "center", padding: "80px 24px" }}
      >
        <WifiOff
          size={48}
          color="rgba(255,255,255,0.2)"
          style={{ margin: "0 auto 16px" }}
        />
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
          Waiting for sensor data...
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: 13,
            marginTop: 6,
          }}
        >
          Make sure your device is powered on and connected.
        </p>
      </motion.div>
    );
  }

  const mStatus = getMoistureStatus(latest.moisture);
  const tStatus = getTempStatus(latest.temperature);
  const fStatus = getFlowStatus(latest.flowRate);
  const avgFlow = readings24h?.length
    ? readings24h.reduce((s, r) => s + r.flowRate, 0) / readings24h.length
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 18px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Wifi size={14} color="#4ade80" />
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              fontWeight: 500,
            }}
          >
            Last update: {timeAgo(latest.timestamp)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#4ade80",
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>
            Live
          </span>
        </div>
      </motion.div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
        }}
      >
        <LiveCard
          icon={<Droplets size={18} />}
          label="Soil Moisture"
          value={latest.moisture}
          unit="%"
          status={mStatus}
          color="#38bdf8"
          max={100}
          delay={0}
        />
        <LiveCard
          icon={<Thermometer size={18} />}
          label="Temperature"
          value={latest.temperature}
          unit="°C"
          status={tStatus}
          color="#fbbf24"
          max={60}
          delay={0.08}
        />
        <LiveCard
          icon={<Wind size={18} />}
          label="Water Flow"
          value={latest.flowRate}
          unit="L/min"
          status={fStatus}
          color="#34d399"
          max={10}
          delay={0.16}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5 }}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${latest.pumpStatus ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 20,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            position: "relative",
            overflow: "hidden",
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
              background: latest.pumpStatus
                ? "radial-gradient(circle,rgba(74,222,128,0.15),transparent 70%)"
                : "radial-gradient(circle,rgba(107,114,128,0.1),transparent 70%)",
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
                background: latest.pumpStatus
                  ? "rgba(74,222,128,0.15)"
                  : "rgba(107,114,128,0.1)",
                border: `1px solid ${latest.pumpStatus ? "rgba(74,222,128,0.3)" : "rgba(107,114,128,0.2)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: latest.pumpStatus ? "#4ade80" : "#6b7280",
              }}
            >
              <Power size={18} />
            </div>
            <div
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: latest.pumpStatus
                  ? "#16a34a"
                  : "rgba(255,255,255,0.1)",
                position: "relative",
                cursor: pumpLoading ? "not-allowed" : "pointer",
                transition: "background 0.3s",
                opacity: pumpLoading ? 0.6 : 1,
              }}
              onClick={handlePump}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: latest.pumpStatus ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.3s",
                }}
              />
            </div>
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
              Pump Control
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
              {latest.pumpStatus ? "ON" : "OFF"}
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 99,
              background: latest.pumpStatus
                ? "rgba(74,222,128,0.12)"
                : "rgba(107,114,128,0.1)",
              border: `1px solid ${latest.pumpStatus ? "rgba(74,222,128,0.25)" : "rgba(107,114,128,0.2)"}`,
              width: "fit-content",
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: latest.pumpStatus ? "#4ade80" : "#6b7280",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: latest.pumpStatus ? "#4ade80" : "#6b7280",
              }}
            >
              {latest.pumpStatus ? "Running" : "Idle"}
            </span>
          </div>
        </motion.div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          {
            title: "Soil Moisture",
            subtitle: "24-hour trend (%)",
            dataKey: "moisture",
            color: "#38bdf8",
            unit: "%",
          },
          {
            title: "Temperature",
            subtitle: "24-hour readings (°C)",
            dataKey: "temperature",
            color: "#fbbf24",
            unit: "°C",
          },
        ].map((chart, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20,
              padding: "20px",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e8f5e9" }}>
                {chart.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                  marginTop: 2,
                }}
              >
                {chart.subtitle}
              </div>
            </div>
            {chartData.length === 0 ? (
              <div
                style={{
                  height: 140,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                  No data yet
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={chart.dataKey}
                    stroke={chart.color}
                    strokeWidth={2}
                    dot={false}
                    name={chart.title}
                    unit={chart.unit}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
          padding: "20px",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e8f5e9" }}>
            Water Flow Rate
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
              marginTop: 2,
            }}
          >
            24-hour flow rate (L/min)
          </div>
        </div>
        {chartData.length === 0 ? (
          <div
            style={{
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
              No data yet
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="flow"
                fill="#34d399"
                radius={[3, 3, 0, 0]}
                name="Flow"
                unit=" L/min"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
        }}
      >
        {[
          {
            icon: <Clock size={16} />,
            label: "Last Reading",
            value: timeAgo(latest.timestamp),
            color: "#38bdf8",
          },
          {
            icon: <Activity size={16} />,
            label: "Readings Today",
            value: `${readings24h?.length ?? 0}`,
            color: "#4ade80",
          },
          {
            icon: <Wind size={16} />,
            label: "Avg Flow (24h)",
            value: `${avgFlow.toFixed(1)} L/min`,
            color: "#34d399",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${s.color}15`,
                border: `1px solid ${s.color}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: s.color,
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e8f5e9" }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Dashboard() {
  const devices = useQuery(api.devices.getDevices);
  const user = useQuery(api.auth.loggedInUser);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    if (devices?.length && !selectedDeviceId)
      setSelectedDeviceId(devices[0]._id);
  }, [devices]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse 120% 60% at 50% 0%, #162e1a 0%, #0d2318 30%, transparent 60%), radial-gradient(ellipse 80% 60% at 0% 50%, rgba(15,43,24,0.9) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 100% 50%, rgba(11,30,36,0.7) 0%, transparent 60%), radial-gradient(ellipse 100% 50% at 50% 100%, rgba(15,43,24,0.5) 0%, transparent 60%), #070d09`,
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
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
          style={{ position: "absolute", inset: 0, opacity: 0.6 }}
        />
        {[640, 900, 1160].map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: d,
              height: d,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-60%)",
              border: `1px ${i === 0 ? "solid" : "dashed"} var(--border-base)`,
              borderRadius: "50%",
            }}
          />
        ))}
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

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(7,13,9,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(32px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(32px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
          boxShadow: scrolled ? "var(--shadow-sm)" : "none",
          transition: "all 0.35s ease",
          padding: "10px 24px",
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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <motion.a
              href="/dashboard"
              whileHover={{ scale: 1.02 }}
              style={{ display: "flex", alignItems: "center", gap: 11 }}
            >
              <motion.div
                whileHover={{ rotate: [0, -7, 7, 0] }}
                transition={{ duration: 0.5 }}
                style={{
                  filter: "drop-shadow(0 4px 14px rgba(22,163,74,.30))",
                  flexShrink: 0,
                }}
              >
                <AgriSenseLogo size={38} />
              </motion.div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1,
                  gap: 3,
                }}
              >
                <span
                  className="fd grad-text"
                  style={{
                    fontSize: 21,
                    fontWeight: 900,
                    letterSpacing: "-0.025em",
                  }}
                >
                  AgriSense
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--text-faint)",
                  }}
                >
                  Smart Solar Irrigation
                </span>
              </div>
            </motion.a>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--badge-bg)",
                border: "1px solid var(--badge-border)",
                color: "var(--badge-color)",
                padding: "7px 18px",
                borderRadius: "var(--r-full)",
                fontSize: 14,
                fontWeight: 600,
                backdropFilter: "blur(12px)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span className="bdot" />
              <span style={{ color: "rgba(255,255,255,0.65)" }}>
                {greeting},
              </span>{" "}
              <span
                style={{
                  color: "var(--brand-500)",
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {user?.name?.split(" ")[0] ?? "Farmer"}
              </span>{" "}
              👋
            </div>

            {devices && devices.length > 0 && (
              <DeviceSelector
                devices={devices}
                selectedId={selectedDeviceId}
                onSelect={setSelectedDeviceId}
              />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => nav("/notifications")}
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
              <AlertCircle size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => nav("/profile")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--grad-brand)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </motion.button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "28px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {devices === undefined ? (
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
        ) : devices.length === 0 ? (
          <EmptyState />
        ) : selectedDeviceId ? (
          <DashboardContent deviceId={selectedDeviceId as Id<"devices">} />
        ) : null}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); } 70% { box-shadow: 0 0 0 6px rgba(74,222,128,0); } 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); } }`}</style>
    </div>
  );
}
