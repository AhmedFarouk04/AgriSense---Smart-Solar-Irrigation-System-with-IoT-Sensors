import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  Droplets,
  Thermometer,
  Wind,
  ChevronDown,
  Calendar,
  Layers,
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
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

type Range = "24h" | "7d";

interface Reading {
  timestamp: number;
  moisture: number;
  temperature: number;
  flowRate: number;
}

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
];

function fmt(ts: number, range: Range) {
  const date = new Date(ts);
  if (range === "24h") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ✅ CustomTooltip — كل الألوان بـ CSS variables
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          color: "var(--text-faint)",
          fontSize: 11,
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {payload.map((p: any) => (
        <div
          key={p.name}
          style={{
            color: p.color,
            fontWeight: 700,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: p.color,
            }}
          />
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
  icon: Icon,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: any;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        background: "var(--bg-card)", // ✅
        border: "1px solid var(--border-card)",
        borderRadius: 16,
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--text-faint)",
        }}
      >
        <Icon size={14} style={{ color }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 800,
            color,
            letterSpacing: "-0.02em",
          }}
        >
          {value.toFixed(1)}
        </span>
        <span
          style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 500 }}
        >
          {unit}
        </span>
      </div>
    </motion.div>
  );
}

export default function Reports() {
  const devices = useQuery(api.devices.getDevices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("24h");
  const [scrolled, setScrolled] = useState(false);
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

  const readings = useQuery(
    range === "24h" ? api.readings.getReadings24h : api.readings.getReadings7d,
    selectedDeviceId ? { deviceId: selectedDeviceId as Id<"devices"> } : "skip",
  );

  const chartData = (() => {
    if (!readings?.length) return [];
    if (range === "24h") {
      return (readings as Reading[]).map((r) => ({
        time: fmt(r.timestamp, "24h"),
        moisture: r.moisture,
        temperature: r.temperature,
        flow: r.flowRate,
      }));
    }
    const byDay: Record<string, { m: number[]; t: number[]; f: number[] }> = {};
    (readings as Reading[]).forEach((r) => {
      const day = fmt(r.timestamp, "7d");
      if (!byDay[day]) byDay[day] = { m: [], t: [], f: [] };
      byDay[day].m.push(r.moisture);
      byDay[day].t.push(r.temperature);
      byDay[day].f.push(r.flowRate);
    });
    return Object.entries(byDay).map(([day, v]) => ({
      time: day,
      moisture: v.m.reduce((a, b) => a + b, 0) / v.m.length,
      temperature: v.t.reduce((a, b) => a + b, 0) / v.t.length,
      flow: v.f.reduce((a, b) => a + b, 0) / v.f.length,
    }));
  })();

  const avg = (vals: number[]) =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const moistureVals =
    (readings as Reading[] | undefined)?.map((r) => r.moisture) ?? [];
  const tempVals =
    (readings as Reading[] | undefined)?.map((r) => r.temperature) ?? [];
  const flowVals =
    (readings as Reading[] | undefined)?.map((r) => r.flowRate) ?? [];

  const totalWater =
    (readings as Reading[] | undefined)?.reduce(
      (acc: number, curr: Reading, i: number, arr: Reading[]) => {
        if (i === 0) return 0;
        const durationMin = (curr.timestamp - arr[i - 1].timestamp) / 60000;
        if (durationMin > 60) return acc;
        return acc + curr.flowRate * durationMin;
      },
      0,
    ) ?? 0;

  const selectedDevice = devices?.find((d) => d._id === selectedDeviceId);

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "var(--text-primary)",
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
          style={{ position: "absolute", inset: 0, opacity: 0.3 }}
        />
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, delay: p.delay }}
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

      {/* ✅ Header — كل الألوان بـ CSS variables */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "var(--bg-nav)" : "transparent",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
          transition: "all 0.3s",
          padding: "14px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
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
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "var(--glass-bg)", // ✅
                border: "1px solid var(--border-card)", // ✅
                color: "var(--text-primary)", // ✅
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--text-primary)", // ✅
                }}
              >
                Analytics Reports
              </h1>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-faint)", // ✅
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  margin: 0,
                }}
              >
                Data-driven insights
              </p>
            </div>
          </div>
          <AgriSenseLogo size={32} />
        </div>
      </header>

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "30px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {devices !== undefined && devices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "80px 24px" }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              No Data to Display
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginBottom: 28,
              }}
            >
              Add a zone to start viewing analytics and reports.
            </div>
            <motion.button
              whileHover={{
                scale: 1.04,
                boxShadow: "0 8px 28px rgba(22,163,74,0.3)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => nav("/add-zone")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                background: "var(--grad-brand)",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <Leaf size={16} /> Add Your First Zone
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 30,
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {/* ✅ Device Dropdown Button */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setDeviceOpen(!deviceOpen)}
                    style={{
                      background: "var(--glass-bg)", // ✅
                      border: "1px solid var(--border-card)", // ✅
                      padding: "10px 16px",
                      borderRadius: 12,
                      color: "var(--text-primary)", // ✅
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <Layers size={15} color="var(--brand-500)" />
                    {selectedDevice?.name ?? "Select Zone"}
                    <ChevronDown size={14} />
                  </button>

                  <AnimatePresence>
                    {deviceOpen && (
                      <>
                        <div
                          style={{ position: "fixed", inset: 0, zIndex: 190 }}
                          onClick={() => setDeviceOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            marginTop: 8,
                            background: "var(--bg-card)", // ✅
                            border: "1px solid var(--border-card)", // ✅
                            borderRadius: 12,
                            overflow: "hidden",
                            minWidth: 200,
                            zIndex: 200,
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                          }}
                        >
                          {devices?.map((d) => (
                            <button
                              key={d._id}
                              onClick={() => {
                                setSelectedDeviceId(d._id);
                                setDeviceOpen(false);
                              }}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                background:
                                  d._id === selectedDeviceId
                                    ? "rgba(74,222,128,0.1)"
                                    : "transparent",
                                border: "none",
                                color: "var(--text-primary)", // ✅
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: 13,
                              }}
                            >
                              {d.name}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* ✅ Range Toggle (24H / 7 Days) */}
                <div
                  style={{
                    display: "flex",
                    background: "var(--glass-bg)", // ✅
                    borderRadius: 12,
                    padding: 4,
                    border: "1px solid var(--border-card)", // ✅
                  }}
                >
                  {(["24h", "7d"] as Range[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: 8,
                        border: "none",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        background:
                          range === r ? "var(--brand-600)" : "transparent", // ✅
                        color: range === r ? "white" : "var(--text-faint)", // ✅
                        transition: "0.2s",
                      }}
                    >
                      {r === "24h" ? "24H" : "7 Days"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ✅ Calendar label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text-faint)", // ✅
                  fontSize: 12,
                }}
              >
                <Calendar size={14} />
                <span>
                  {range === "24h"
                    ? "Showing hourly performance"
                    : "Showing daily trends"}
                </span>
              </div>
            </div>

            {readings === undefined ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "100px 0",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: "3px solid var(--border-card)", // ✅
                    borderTopColor: "var(--brand-500)", // ✅
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : (
              <>
                {/* Stat Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <StatCard
                    label="Avg Moisture"
                    value={avg(moistureVals)}
                    unit="%"
                    color="#38bdf8"
                    icon={Droplets}
                  />
                  <StatCard
                    label="Avg Temp"
                    value={avg(tempVals)}
                    unit="°C"
                    color="#fbbf24"
                    icon={Thermometer}
                  />
                  <StatCard
                    label="Avg Flow"
                    value={avg(flowVals)}
                    unit="L/m"
                    color="#34d399"
                    icon={Wind}
                  />
                  <StatCard
                    label="Total Water Used"
                    value={totalWater}
                    unit="Liters"
                    color="#a78bfa"
                    icon={Droplets}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 20,
                  }}
                >
                  {/* ✅ Soil Moisture Chart */}
                  <div
                    style={{
                      background: "var(--bg-card)", // ✅
                      border: "1px solid var(--border-card)", // ✅
                      borderRadius: 24,
                      padding: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        marginBottom: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: "var(--text-primary)", // ✅
                      }}
                    >
                      <Droplets size={16} color="#38bdf8" /> Soil Moisture
                      History
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="gradMoist"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#38bdf8"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#38bdf8"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-card)" // ✅
                          vertical={false}
                        />
                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "var(--text-faint)", fontSize: 11 }} // ✅
                          minTickGap={30}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "var(--text-faint)", fontSize: 11 }} // ✅
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                          y={30}
                          stroke="#f87171"
                          strokeDasharray="3 3"
                          label={{
                            position: "right",
                            value: "Low",
                            fill: "#f87171",
                            fontSize: 10,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="moisture"
                          stroke="#38bdf8"
                          strokeWidth={3}
                          fill="url(#gradMoist)"
                          name="Moisture"
                          unit="%"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: 20,
                    }}
                  >
                    {/* ✅ Temperature Chart */}
                    <div
                      style={{
                        background: "var(--bg-card)", // ✅
                        border: "1px solid var(--border-card)", // ✅
                        borderRadius: 24,
                        padding: "24px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          marginBottom: 20,
                          color: "var(--text-secondary)", // ✅
                        }}
                      >
                        Temperature Variance
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border-card)" // ✅
                            vertical={false}
                          />
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                            minTickGap={40}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--text-faint)", fontSize: 11 }} // ✅
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#fbbf24"
                            strokeWidth={2}
                            dot={range === "7d"}
                            name="Temp"
                            unit="°C"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* ✅ Water Consumption Chart */}
                    <div
                      style={{
                        background: "var(--bg-card)", // ✅
                        border: "1px solid var(--border-card)", // ✅
                        borderRadius: 24,
                        padding: "24px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          marginBottom: 20,
                          color: "var(--text-secondary)", // ✅
                        }}
                      >
                        Water Consumption
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border-card)" // ✅
                            vertical={false}
                          />
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                            minTickGap={40}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--text-faint)", fontSize: 11 }} // ✅
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="flow"
                            fill="#34d399"
                            radius={[4, 4, 0, 0]}
                            name="Avg Flow"
                            unit="L/m"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
