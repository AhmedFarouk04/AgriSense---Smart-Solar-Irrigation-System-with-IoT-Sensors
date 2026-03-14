import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Thermometer,
  Wind,
  Power,
  Plus,
  ChevronDown,
  Wifi,
  WifiOff,
  Clock,
  Activity,
  AlertCircle,
  Leaf,
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

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

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

function GaugeRing({
  value,
  max,
  color,
  size = 72,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
}) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / max, 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

function LiveCard({
  icon,
  label,
  value,
  unit,
  status,
  color,
  max,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  status: { label: string; color: string };
  color: string;
  max: number;
  delay: number;
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
          {icon}
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
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f1f12",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 12,
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
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

function EmptyState() {
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
      }}
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ marginBottom: 36 }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(74,222,128,0.07)",
            border: "1px solid rgba(74,222,128,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Leaf size={44} color="#4ade80" />
          </div>
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#fbbf24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              color: "#000",
            }}
          >
            ?
          </div>
        </div>
      </motion.div>
      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#e8f5e9",
          marginBottom: 12,
          letterSpacing: "-0.025em",
        }}
      >
        Welcome! Let's get your farm online 🌱
      </h2>
      <p
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 15,
          marginBottom: 32,
          maxWidth: 380,
        }}
      >
        Add your first zone to start monitoring soil moisture, temperature, and
        water flow in real-time.
      </p>
      <motion.button
        whileHover={{
          scale: 1.04,
          boxShadow: "0 8px 32px rgba(22,163,74,0.35)",
        }}
        whileTap={{ scale: 0.97 }}
        onClick={() => nav("/add-zone")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 32px",
          background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
          color: "white",
          borderRadius: 16,
          fontWeight: 700,
          fontSize: 15,
          border: "none",
          cursor: "pointer",
          marginBottom: 48,
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
            title: "Pump Control",
            desc: "Turn irrigation on/off from anywhere",
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
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "18px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{h.icon}</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#e8f5e9",
                marginBottom: 4,
              }}
            >
              {h.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.38)",
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

function DeviceSelector({
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
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          color: "#e8f5e9",
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
              right: 0,
              background: "#0d1a10",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              overflow: "hidden",
              zIndex: 50,
              minWidth: 180,
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
                  gap: 8,
                  padding: "10px 14px",
                  background:
                    d._id === selectedId
                      ? "rgba(74,222,128,0.08)"
                      : "transparent",
                  border: "none",
                  color: "#e8f5e9",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
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
              </button>
            ))}
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
                borderTop: "1px solid rgba(255,255,255,0.06)",
                color: "#4ade80",
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
        background:
          "radial-gradient(ellipse 100% 80% at 50% -5%, #0f2b18 0%, #0b1e24 40%, #070d09 70%)",
        color: "#e8f5e9",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(7,13,9,0.88)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              <motion.div
                whileHover={{ rotate: [0, -7, 7, 0] }}
                transition={{ duration: 0.5 }}
                style={{
                  padding: 7,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  flexShrink: 0,
                  filter: "drop-shadow(0 4px 14px rgba(22,163,74,.25))",
                }}
              >
                <AgriSenseLogo size={32} />
              </motion.div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    letterSpacing: "-0.025em",
                    background:
                      "linear-gradient(135deg,#4ade80 0%,#38bdf8 50%,#fbbf24 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  AgriSense
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)",
                  }}
                >
                  Smart Solar Irrigation
                </div>
              </div>
            </a>

            <div
              style={{
                width: 1,
                height: 32,
                background: "rgba(255,255,255,0.08)",
              }}
            />

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "5px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {greeting},{" "}
              <span style={{ color: "#4ade80", fontWeight: 800 }}>
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
            <button
              onClick={() => nav("/notifications")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <AlertCircle size={16} />
            </button>
            <button
              onClick={() => nav("/profile")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
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
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
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
    </div>
  );
}
