import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, ReferenceLine } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
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
  BarChart2,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Settings as SettingsIcon,
  HelpCircle,
  PlusCircle,
  ListIcon,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { AgriSenseLogo } from "../components/Logo";
import { useAuthActions } from "@convex-dev/auth/react";
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

function getMoistureStatus(v: number, min: number = 30, max: number = 70) {
  if (v < min) return { label: "Dry", color: "#f87171" };
  if (v <= max) return { label: "Good", color: "#4ade80" };
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
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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
  const deviceDetails = useQuery(api.devices.getDevice, { deviceId });
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

  if (
    latest === undefined ||
    readings24h === undefined ||
    deviceDetails === undefined
  ) {
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
            border: "3px solid var(--border-card)",
            borderTopColor: "var(--brand-500)",
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
          color="var(--text-faint)"
          style={{ margin: "0 auto 16px" }}
        />
        <p style={{ color: "var(--text-faint)", fontSize: 15 }}>
          Waiting for sensor data...
        </p>
      </motion.div>
    );
  }

  const minMoist = deviceDetails.customMinMoisture ?? 30;
  const maxMoist = deviceDetails.customMaxMoisture ?? 70;
  const mStatus = getMoistureStatus(latest.moisture, minMoist, maxMoist);
  const tStatus = getTempStatus(latest.temperature);
  const fStatus = getFlowStatus(latest.flowRate);
  const avgFlow = readings24h?.length
    ? readings24h.reduce((s, r) => s + r.flowRate, 0) / readings24h.length
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Live Status Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 18px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          borderRadius: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Wifi size={14} color="#4ade80" />
          <span
            style={{
              fontSize: 12,
              color: "var(--text-faint)",
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

      {/* ── Main KPIs & Pump Control ── */}
      <div className="dashboard-grid">
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

        {/* ── Pump Control Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5 }}
          style={{
            background: "var(--bg-card)",
            border: `1px solid ${latest.pumpStatus ? "rgba(74,222,128,0.25)" : "var(--border-card)"}`,
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
                  ? "#16a34a"
                  : "var(--border-base)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: latest.pumpStatus ? "#4ade80" : "#6b7280",
              }}
            >
              {pumpLoading ? (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid var(--border-card)",
                    borderTopColor: "var(--brand-500)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              ) : (
                <Power size={18} />
              )}
            </div>
            <div
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: latest.pumpStatus
                  ? "#16a34a"
                  : "var(--border-base)",
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
                color: "var(--text-faint)",
                fontWeight: 600,
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
                color: "var(--text-primary)",
              }}
            >
              {latest.pumpStatus ? "ON" : "OFF"}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Charts Section ── */}
      {chartData.length === 0 ? (
        <div
          style={{
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            borderRadius: 20,
          }}
        >
          <span style={{ color: "var(--text-faint)", fontSize: 13 }}>
            Waiting for enough data to generate charts...
          </span>
        </div>
      ) : (
        <>
          <div className="charts-grid">
            {/* ── Moisture Chart ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                borderRadius: 20,
                padding: "20px",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Soil Moisture
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    marginTop: 2,
                  }}
                >
                  24-hour trend (%)
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} syncId="dashboardCharts">
                  <defs>
                    <linearGradient
                      id="colorMoisture"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-card)"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={minMoist}
                    stroke="#f87171"
                    strokeDasharray="3 3"
                    opacity={0.5}
                  />
                  <ReferenceLine
                    y={maxMoist}
                    stroke="#60a5fa"
                    strokeDasharray="3 3"
                    opacity={0.5}
                  />
                  <Area
                    type="natural"
                    dataKey="moisture"
                    stroke="#38bdf8"
                    strokeWidth={2.4}
                    fillOpacity={1}
                    fill="url(#colorMoisture)"
                    name="Moisture"
                    unit="%"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* ── Temperature Chart ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                borderRadius: 20,
                padding: "20px",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Temperature
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    marginTop: 2,
                  }}
                >
                  24-hour readings (°C)
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} syncId="dashboardCharts">
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="4%" stopColor="#fbbf24" stopOpacity={0.38} />
                      <stop offset="96%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-card)"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="natural"
                    dataKey="temperature"
                    stroke="#fbbf24"
                    strokeWidth={2.4}
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                    dot={false}
                    name="Temperature"
                    unit="°C"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* ── Flow Rate Chart ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: 20,
              padding: "20px",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Water Flow Rate
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData} syncId="dashboardCharts">
                <defs>
                  <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="4%" stopColor="#34d399" stopOpacity={0.42} />
                    <stop offset="96%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-card)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "var(--glass-bg)" }}
                />
                <Area
                  type="natural"
                  dataKey="flow"
                  stroke="#34d399"
                  strokeWidth={2.4}
                  fillOpacity={1}
                  fill="url(#colorFlow)"
                  name="Flow"
                  unit="L/min"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}

      {/* ── Quick Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="stats-grid"
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
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
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
                  color: "var(--text-faint)",
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
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
  const events = useQuery(api.users.getEvents);
  const { signOut } = useAuthActions();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [lastViewed, setLastViewed] = useState(() =>
    parseInt(localStorage.getItem("lastViewedNotifications") || "0"),
  );

  useEffect(() => {
    const handleViewed = () => {
      setLastViewed(
        parseInt(localStorage.getItem("lastViewedNotifications") || "0"),
      );
    };
    window.addEventListener("notifications_viewed", handleViewed);
    return () =>
      window.removeEventListener("notifications_viewed", handleViewed);
  }, []);

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

  const unreadCount = (events ?? []).filter(
    (e: any) =>
      (e.type === "alert" || e.type === "low_moisture") &&
      e.timestamp > lastViewed,
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Background Decor */}
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

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "var(--bg-nav)" : "transparent",
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
              style={{ display: "flex", alignItems: "center", gap: 11 }}
            >
              <AgriSenseLogo size={38} />
              <div
                className="hide-on-mobile"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1,
                }}
              >
                <span
                  className="fd grad-text"
                  style={{ fontSize: 21, fontWeight: 900 }}
                >
                  AgriSense
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--text-faint)",
                  }}
                >
                  Smart Solar Irrigation
                </span>
              </div>
            </motion.a>

            {/* Greeting badge */}
            <div
              className="hide-on-mobile"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--badge-bg)",
                padding: "7px 18px",
                borderRadius: "var(--r-full)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{greeting},</span>
              <span style={{ color: "var(--brand-500)", fontWeight: 800 }}>
                {user?.name?.split(" ")[0] ?? "Farmer"}
              </span>{" "}
              👋
            </div>

            {/* Device Selector */}
            {devices && devices.length > 0 && (
              <DeviceSelector
                devices={devices}
                selectedId={selectedDeviceId}
                onSelect={setSelectedDeviceId}
              />
            )}
          </div>

          <div
            className="header-actions"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            {/* ✅ My Zones button - جديد */}
            {devices && devices.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => nav("/devices")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 14px",
                  height: 36,
                  borderRadius: 10,
                  background: "var(--glass-bg)",
                  border: "1px solid var(--border-card)",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
                title="View all zones"
              >
                <ListIcon size={16} />
                <span className="hide-on-mobile">My Zones</span>
              </motion.button>
            )}

            {/* Reports button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => nav("/reports")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 14px",
                height: 36,
                borderRadius: 10,
                background: "var(--success-bg)",
                border: "1px solid rgba(74,222,128,0.2)",
                cursor: "pointer",
                color: "#4ade80",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <BarChart2 size={16} />
              <span className="hide-on-mobile">Reports</span>
            </motion.button>

            {/* Notifications button */}
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
                position: "relative",
              }}
            >
              <AlertCircle size={16} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#ef4444",
                    color: "white",
                    fontSize: 10,
                    fontWeight: "bold",
                    minWidth: 18,
                    height: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 99,
                    border: "2px solid var(--bg-page)",
                  }}
                >
                  {unreadCount > 9 ? "+9" : unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* User Dropdown */}
            <div style={{ position: "relative" }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  height: 36,
                  padding: "0 10px",
                  borderRadius: 10,
                  background: "var(--grad-brand)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {user?.name?.[0]?.toUpperCase() ?? "U"}
                <ChevronDown
                  size={14}
                  style={{
                    opacity: 0.7,
                    transform: userMenuOpen ? "rotate(180deg)" : "none",
                    transition: "0.2s",
                  }}
                />
              </motion.button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 190 }}
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: 10,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-card)",
                        borderRadius: 12,
                        padding: 6,
                        minWidth: 180,
                        zIndex: 200,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                      }}
                    >
                      {[
                        {
                          label: "My Profile",
                          icon: <UserIcon size={14} />,
                          path: "/profile",
                        },
                        {
                          label: "Settings",
                          icon: <SettingsIcon size={14} />,
                          path: "/settings",
                        },
                        {
                          label: "Help & Support",
                          icon: <HelpCircle size={14} />,
                          path: "/help",
                        },
                      ].map((item) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            setUserMenuOpen(false);
                            nav(item.path);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            borderRadius: 8,
                          }}
                        >
                          {item.icon} {item.label}
                        </button>
                      ))}

                      <div
                        style={{
                          height: 1,
                          background: "var(--border-card)",
                          margin: "4px 0",
                        }}
                      />
                      <button
                        onClick={async () => {
                          try {
                            await signOut();
                            nav("/");
                          } catch {
                            toast.error("Logout failed");
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "transparent",
                          border: "none",
                          color: "#f87171",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          borderRadius: 8,
                        }}
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
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
                border: "3px solid var(--border-card)",
                borderTopColor: "var(--brand-500)",
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
      `}</style>
    </div>
  );
}
