import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  Droplets,
  Thermometer,
  Wind,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
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
  Legend,
  ReferenceLine,
} from "recharts";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
];

type Range = "24h" | "7d";

function fmt(ts: number, range: Range) {
  if (range === "24h") {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
          {p.name}: {Number(p.value).toFixed(1)}
          {p.unit ?? ""}
        </div>
      ))}
    </div>
  );
};

function StatCard({
  label,
  value,
  unit,
  color,
  trend,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  trend?: "up" | "down" | "flat";
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-card)",
        borderRadius: 16,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-faint)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            color,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {value.toFixed(1)}
        </span>
        <span
          style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 2 }}
        >
          {unit}
        </span>
        {trend && (
          <span
            style={{
              marginBottom: 2,
              color:
                trend === "up"
                  ? "#4ade80"
                  : trend === "down"
                    ? "#f87171"
                    : "var(--text-faint)",
            }}
          >
            {trend === "up" ? (
              <TrendingUp size={14} />
            ) : trend === "down" ? (
              <TrendingDown size={14} />
            ) : (
              <Minus size={14} />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const devices = useQuery(api.devices.getDevices);
  const [scrolled, setScrolled] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("24h");
  const [deviceOpen, setDeviceOpen] = useState(false);

  useEffect(() => {
    if (devices?.length && !selectedDeviceId)
      setSelectedDeviceId(devices[0]._id);
  }, [devices]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const readings24h = useQuery(
    api.readings.getReadings24h,
    selectedDeviceId ? { deviceId: selectedDeviceId as Id<"devices"> } : "skip",
  );

  const readings7d = useQuery(
    api.readings.getReadings7d,
    selectedDeviceId ? { deviceId: selectedDeviceId as Id<"devices"> } : "skip",
  );

  const rawReadings = range === "24h" ? readings24h : readings7d;

  // للـ 7d — aggregate بالـ day
  const chartData = (() => {
    if (!rawReadings?.length) return [];
    if (range === "24h") {
      return rawReadings.map((r) => ({
        time: fmt(r.timestamp, range),
        moisture: r.moisture,
        temperature: r.temperature,
        flow: r.flowRate,
      }));
    }
    // Group by day for 7d
    const byDay: Record<
      string,
      { moisture: number[]; temperature: number[]; flow: number[] }
    > = {};
    rawReadings.forEach((r) => {
      const day = new Date(r.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!byDay[day]) byDay[day] = { moisture: [], temperature: [], flow: [] };
      byDay[day].moisture.push(r.moisture);
      byDay[day].temperature.push(r.temperature);
      byDay[day].flow.push(r.flowRate);
    });
    return Object.entries(byDay).map(([day, vals]) => ({
      time: day,
      moisture: vals.moisture.reduce((a, b) => a + b, 0) / vals.moisture.length,
      temperature:
        vals.temperature.reduce((a, b) => a + b, 0) / vals.temperature.length,
      flow: vals.flow.reduce((a, b) => a + b, 0) / vals.flow.length,
    }));
  })();

  // Stats
  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const moistureVals = rawReadings?.map((r: any) => r.moisture) ?? [];
  const tempVals = rawReadings?.map((r: any) => r.temperature) ?? [];
  const flowVals = rawReadings?.map((r: any) => r.flowRate) ?? [];
  const totalWater =
    rawReadings?.reduce((s: number, r: any, i: number, arr: any[]) => {
      if (i === 0) return 0;
      const dt = (arr[i].timestamp - arr[i - 1].timestamp) / 60000;
      return s + r.flowRate * dt;
    }, 0) ?? 0;

  const selectedDevice = devices?.find((d) => d._id === selectedDeviceId);

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
                <BarChart2 size={15} style={{ color: "var(--brand-500)" }} />
                Reports
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  letterSpacing: "0.04em",
                }}
              >
                Historical sensor data
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
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          {/* Device selector */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setDeviceOpen(!deviceOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                borderRadius: 12,
                color: "var(--text-primary)",
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
                    background: selectedDevice?.isActive
                      ? "#4ade80"
                      : "#6b7280",
                  }}
                />
                {selectedDevice?.name ?? "Select Zone"}
              </div>
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </button>
            {deviceOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  background: "#0d1a10",
                  border: "1px solid var(--border-card)",
                  borderRadius: 12,
                  overflow: "hidden",
                  zIndex: 50,
                  minWidth: 180,
                }}
              >
                {(devices ?? []).map((d) => (
                  <button
                    key={d._id}
                    onClick={() => {
                      setSelectedDeviceId(d._id);
                      setDeviceOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background:
                        d._id === selectedDeviceId
                          ? "rgba(74,222,128,0.08)"
                          : "transparent",
                      border: "none",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: d.isActive ? "#4ade80" : "#6b7280",
                      }}
                    />
                    {d.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Range selector */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["24h", "7d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background:
                    range === r ? "rgba(74,222,128,0.12)" : "var(--glass-bg)",
                  border: `1px solid ${range === r ? "var(--brand-500)" : "var(--border-card)"}`,
                  color: range === r ? "var(--brand-500)" : "var(--text-muted)",
                  transition: "all 0.2s",
                }}
              >
                {r === "24h" ? "Last 24h" : "Last 7 days"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading */}
        {rawReadings === undefined && (
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

        {rawReadings !== undefined && (
          <>
            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <StatCard
                label="Avg Moisture"
                value={avg(moistureVals)}
                unit="%"
                color="#38bdf8"
              />
              <StatCard
                label="Avg Temperature"
                value={avg(tempVals)}
                unit="°C"
                color="#fbbf24"
              />
              <StatCard
                label="Avg Flow"
                value={avg(flowVals)}
                unit=" L/m"
                color="#34d399"
              />
              <StatCard
                label="Total Water"
                value={totalWater}
                unit=" L"
                color="#a78bfa"
              />
            </motion.div>

            {/* No data */}
            {chartData.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                  }}
                >
                  No data yet
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Sensor readings will appear here once your device starts
                  sending data.
                </div>
              </div>
            )}

            {chartData.length > 0 && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {/* Moisture chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: "rgba(255,255,255,0.02)",
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
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Droplets size={15} color="#38bdf8" /> Soil Moisture
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-faint)",
                        marginTop: 2,
                      }}
                    >
                      {range === "24h"
                        ? "Hourly readings (%)"
                        : "Daily average (%)"}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
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
                        width={30}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine
                        y={30}
                        stroke="#f87171"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                      />
                      <ReferenceLine
                        y={70}
                        stroke="#60a5fa"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="moisture"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={false}
                        name="Moisture"
                        unit="%"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Temp chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    background: "rgba(255,255,255,0.02)",
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
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Thermometer size={15} color="#fbbf24" /> Temperature
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-faint)",
                        marginTop: 2,
                      }}
                    >
                      {range === "24h"
                        ? "Hourly readings (°C)"
                        : "Daily average (°C)"}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
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
                        width={30}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        dot={false}
                        name="Temp"
                        unit="°C"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Flow chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    background: "rgba(255,255,255,0.02)",
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
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Wind size={15} color="#34d399" /> Water Flow
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-faint)",
                        marginTop: 2,
                      }}
                    >
                      {range === "24h"
                        ? "Flow rate (L/min)"
                        : "Daily average (L/min)"}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
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
                        width={30}
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
                </motion.div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
