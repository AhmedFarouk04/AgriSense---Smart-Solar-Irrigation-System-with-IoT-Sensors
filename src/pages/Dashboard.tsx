import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  Loader2,
  PlusCircle,
  ListIcon,
  Sprout,
  ListChecks,
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
  if (v === 0) return { label: "No Flow", color: "#f97316" };
  if (v < 2) return { label: "Low", color: "#fbbf24" };
  return { label: "Flowing", color: "#4ade80" };
}

export const showCleanToast = (
  title: string,
  subtitle?: string,
  type: "success" | "error" | "info" | "warning" = "info",
) => {
  if (type === "warning") toast.warning(title, { description: subtitle });
  else if (type === "error") toast.error(title, { description: subtitle });
  else if (type === "success") toast.success(title, { description: subtitle });
  else toast.info(title, { description: subtitle });
};

export const showCleanErrorToast = (error: any) => {
  // Strict Error Parser to strip ALL Convex/Server internals
  let msg = error?.message || "An unexpected error occurred.";

  // 1. Cut off stack traces (usually start with "at handler" or "called by")
  msg = msg.split(/\n\s*at /)[0];
  msg = msg.split(/called by/i)[0];

  // 2. Remove Convex wrappers and technical terms
  msg = msg.replace(/\[CONVEX.*?\]/g, "");
  msg = msg.replace(/Server Error/gi, "");
  msg = msg.replace(/Uncaught Error:/gi, "");
  msg = msg.replace(/Request ID:.*/gi, "");
  msg = msg.replace(/^[⚠️⚠✅ℹ️🧪🛑]+\s*/, "");
  msg = msg.trim();

  // Split cleanly
  const parts = msg
    .split("\n")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const title = parts[0] || "Error";
  const subtitle = parts.slice(1).join(" ");

  showCleanToast(title, subtitle, "warning");
};

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const chartTickFormatter = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

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
  const moistureForecast = useQuery(api.readings.getMoistureForecast, {
    deviceId,
  });
  const deviceDetails = useQuery(api.devices.getDevice, { deviceId });
  const fetchReading = useAction(api.readings.fetchAndSaveReading);
  const controlPump = useAction(api.readings.controlPump);
  const startFertilization = useAction(api.readings.startFertilization);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [fertilizeLoading, setFertilizeLoading] = useState(false);
  const [showFertilizeConfirm, setShowFertilizeConfirm] = useState(false);
  const [showFertilizeError, setShowFertilizeError] = useState(false);

  const activeSession = useQuery(api.readings.getActiveFertilizationSession, {
    deviceId,
  });
  // Defensive guard: Ensure UI accurately reflects OFF state even before DB syncs
  const isFertilizing = !!activeSession && latest?.pumpStatus === true;

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
    } catch (err) {
      showCleanErrorToast(err);
    } finally {
      setPumpLoading(false);
    }
  };

  const handleFertilize = async () => {
    if (
      !latest ||
      !latest.pumpStatus ||
      (latest.flowRate < 0.1 && !deviceDetails?.isSimulationMode)
    ) {
      setShowFertilizeError(true);
      return;
    }
    setShowFertilizeConfirm(true);
  };

  const confirmStartFertilization = async () => {
    setShowFertilizeConfirm(false); // Close the confirmation modal
    setFertilizeLoading(true); // Start loading state
    try {
      await startFertilization({
        deviceId,
        durationMinutes: 10,
        confirmed: true,
      });
      await refresh();
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("Water flow is unavailable") ||
        msg.includes("Pump is OFF") ||
        msg.includes("Low Flow") ||
        msg.includes("Low Moisture")
      ) {
        setShowFertilizeError(true); // Show the specific error modal
      } else {
        showCleanErrorToast(err);
      }
    } finally {
      setFertilizeLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!readings24h?.length) return [];
    const step = Math.max(1, Math.ceil(readings24h.length / 72));
    return readings24h
      .filter((_, i) => i % step === 0)
      .map((r) => ({
        time: r.timestamp,
        moisture: r.moisture,
        temperature: r.temperature,
        flow: r.flowRate,
      }));
  }, [readings24h]);

  const maxFlowForChart = useMemo(() => {
    if (!chartData.length) return 5;
    const max = Math.max(...chartData.map((d) => d.flow));
    return Math.max(3, Math.ceil(max + 0.5));
  }, [chartData]);

  const avgFlow = useMemo(() => {
    if (!readings24h?.length) return 0;
    return readings24h.reduce((s, r) => s + r.flowRate, 0) / readings24h.length;
  }, [readings24h]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Live Status Bar ── */}
      {deviceDetails.isSimulationMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: 14,
            color: "#d97706",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              padding: "4px",
              background: "rgba(245,158,11,0.15)",
              borderRadius: "8px",
              display: "flex",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </div>
          <span>
            Simulation Mode Active — Live Firebase updates are paused.
          </span>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "10px 18px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          borderRadius: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Wifi
            size={14}
            color={deviceDetails.isSimulationMode ? "#f59e0b" : "#4ade80"}
          />
          <span
            style={{
              fontSize: 12,
              color: "var(--text-faint)",
              fontWeight: 500,
            }}
          >
            Last update: {timeAgo(latest.timestamp)}
          </span>
          {deviceDetails.isSimulationMode && (
            <span
              style={{
                fontSize: 10,
                background: "rgba(245, 158, 11, 0.15)",
                color: "#f59e0b",
                padding: "2px 6px",
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              Simulated readings
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: deviceDetails.isSimulationMode
                ? "#f59e0b"
                : "#4ade80",
              animation: "pulse 2s infinite",
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: deviceDetails.isSimulationMode ? "#f59e0b" : "#4ade80",
              fontWeight: 600,
            }}
          >
            {deviceDetails.isSimulationMode ? "Mock Live" : "Live"}
          </span>
        </div>
      </motion.div>

      {/* ── Main KPIs & Valve Control ── */}
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

        {/* ── Valve Control Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5 }}
          style={{
            background: "var(--bg-card)",
            border: `1px solid ${isFertilizing ? "var(--brand-500)" : latest.pumpStatus ? "rgba(34,197,94,0.3)" : "var(--border-card)"}`,
            borderRadius: 20,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            position: "relative",
            overflow: "hidden",
            boxShadow: isFertilizing
              ? "0 0 24px rgba(34, 197, 94, 0.15)"
              : "none",
            transition: "all 0.5s ease",
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
              Valve Control
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
          <button
            onClick={handleFertilize}
            disabled={fertilizeLoading || isFertilizing}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 10,
              border: isFertilizing
                ? "none"
                : "1px solid rgba(34, 197, 94, 0.3)",
              background: isFertilizing
                ? "var(--grad-brand)"
                : "rgba(34, 197, 94, 0.1)",
              color: isFertilizing ? "white" : "var(--brand-500)",
              fontSize: 13,
              fontWeight: 800,
              cursor:
                fertilizeLoading || isFertilizing ? "not-allowed" : "pointer",
              opacity: fertilizeLoading ? 0.7 : 1,
              boxShadow: isFertilizing
                ? "0 4px 15px rgba(34, 197, 94, 0.35)"
                : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.3s ease",
            }}
          >
            {isFertilizing ? (
              <>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "white",
                    animation: "pulse 2s infinite",
                  }}
                />
                Running...
              </>
            ) : fertilizeLoading ? (
              "Starting..."
            ) : (
              "Fertilize"
            )}
          </button>
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
              <ResponsiveContainer width="100%" height={140} debounce={120}>
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
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                    interval="preserveStartEnd"
                    tickFormatter={chartTickFormatter}
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
                    type="monotoneX"
                    dataKey="moisture"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMoisture)"
                    name="Moisture"
                    unit="%"
                    isAnimationActive={false}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: "#38bdf8" }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
              <ResponsiveContainer width="100%" height={140} debounce={120}>
                <LineChart data={chartData} syncId="dashboardCharts">
                  <defs>
                    <linearGradient id="tempGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="100%" stopColor="#f59e0b" />
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
                    interval="preserveStartEnd"
                    tickFormatter={chartTickFormatter}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    domain={[0, 45]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotoneX"
                    dataKey="temperature"
                    stroke="url(#tempGlow)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: "#fbbf24" }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    name="Temperature"
                    unit="°C"
                  />
                </LineChart>
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
            <ResponsiveContainer width="100%" height={120} debounce={120}>
              <BarChart data={chartData} syncId="dashboardCharts">
                <defs>
                  <linearGradient id="flowBars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.55} />
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
                  interval="preserveStartEnd"
                  tickFormatter={chartTickFormatter}
                />
                <YAxis
                  tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  domain={[0, maxFlowForChart]}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "var(--glass-bg)" }}
                />
                <Bar
                  dataKey="flow"
                  fill="url(#flowBars)"
                  radius={[3, 3, 0, 0]}
                  name="Flow"
                  unit=" L/min"
                  isAnimationActive={false}
                  maxBarSize={14}
                />
              </BarChart>
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
          {
            icon: <Droplets size={16} />,
            label: "Moisture Forecast",
            value:
              moistureForecast?.status === "predicted"
                ? `${moistureForecast.hoursToThreshold}h to low`
                : moistureForecast?.status === "below_threshold"
                  ? "Already low"
                  : moistureForecast?.status === "stable"
                    ? "Stable"
                    : "Learning...",
            color: "#60a5fa",
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

      {/* ── Custom Fertilization Modals ── */}
      {/* Error Modal (No Flow) */}
      {showFertilizeError && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--glass-bg)",
              border: "1px solid var(--border-card)",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "320px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "var(--error-color)",
                marginBottom: "8px",
              }}
            >
              Cannot start fertilization
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              Water flow is currently unavailable.
              <br />
              Please start irrigation first.
            </p>
            <button
              onClick={() => setShowFertilizeError(false)}
              style={{
                width: "100%",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-primary)",
                fontWeight: "600",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid var(--border-base)",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showFertilizeConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--glass-bg)",
              border: "1px solid var(--border-card)",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "320px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              Confirm Fertilization
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to start the fertilization session?
              <br />
              <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>
                Safety mode will auto-stop on high temperature, zero flow, or
                max duration.
              </span>
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowFertilizeConfirm(false)}
                style={{
                  flex: 1,
                  backgroundColor: "var(--bg-main)",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  padding: "10px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-base)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmStartFertilization}
                disabled={fertilizeLoading}
                style={{
                  flex: 1,
                  backgroundColor: "var(--success-color)",
                  color: "white",
                  fontWeight: "600",
                  padding: "10px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: fertilizeLoading ? "not-allowed" : "pointer",
                  opacity: fertilizeLoading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {fertilizeLoading ? (
                  <>
                    <Loader2
                      size={15}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    Starting...
                  </>
                ) : (
                  "Start"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
  // Removed showFertilizeError from here as it's now handled internally by DashboardContent

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
    (e: any) => e.timestamp > lastViewed,
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
        className="header-container"
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
          <div
            className="header-left"
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
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
            {}
            {devices && devices.length > 0 && (
              <motion.button
                className="nav-action-btn hide-on-mobile"
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
              className="nav-action-btn hide-on-mobile"
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

            <motion.button
              className="nav-action-btn hide-on-mobile"
              whileHover={{ scale: 1.05 }}
              onClick={() => nav("/weekly-actions")}
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
              title="Weekly tasks"
            >
              <ListChecks size={16} />
              <span className="hide-on-mobile">Weekly Actions</span>
            </motion.button>

            {/* Notifications button */}
            <motion.button
              className="nav-action-btn"
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
                className="nav-action-btn"
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
                          label: "My Zones",
                          icon: <ListIcon size={14} />,
                          path: "/devices",
                          className: "mobile-only-flex",
                        },
                        {
                          label: "Reports",
                          icon: <BarChart2 size={14} />,
                          path: "/reports",
                          className: "mobile-only-flex",
                        },
                        {
                          label: "Weekly Actions",
                          icon: <ListChecks size={14} />,
                          path: "/weekly-actions",
                          className: "mobile-only-flex",
                        },
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
                        {
                          label: "Agronomy Catalog",
                          icon: <Sprout size={14} />,
                          path: "/agronomy-catalog",
                        },
                      ].map((item) => (
                        <button
                          key={item.path}
                          className={item.className || ""}
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
          <DashboardContent
            deviceId={selectedDeviceId as Id<"devices">}
            // Pass down error state if needed, though it's now handled internally by DashboardContent
          />
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
