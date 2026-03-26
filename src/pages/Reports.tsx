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

// تعريف نوع القراءة لتجنب خطأ الـ any
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

// دالة الوقت تعمل بنظام 12 ساعة (AM/PM)
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f1f12",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.5)",
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
        background: "rgba(255,255,255,0.03)",
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

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(7,13,9,0.8)" : "transparent",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.08)" : "transparent"}`,
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
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                Analytics Reports
              </h1>
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
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
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDeviceOpen(!deviceOpen)}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "10px 16px",
                  borderRadius: 12,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <Layers size={15} color="#4ade80" />
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
                        background: "#0f1f12",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        overflow: "hidden",
                        minWidth: 200,
                        zIndex: 200,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
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
                            color: "white",
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

            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: 4,
                border: "1px solid rgba(255,255,255,0.1)",
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
                    background: range === r ? "#16a34a" : "transparent",
                    color: range === r ? "white" : "rgba(255,255,255,0.4)",
                    transition: "0.2s",
                  }}
                >
                  {r === "24h" ? "24H" : "7 Days"}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "rgba(255,255,255,0.3)",
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
                border: "3px solid rgba(255,255,255,0.05)",
                borderTopColor: "#4ade80",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : (
          <>
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
              style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
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
                  }}
                >
                  <Droplets size={16} color="#38bdf8" /> Soil Moisture History
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
                      stroke="rgba(255,255,255,0.03)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                      minTickGap={30}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
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

              {/* ✅ التعديل الأهم للـ Responsive: تم تغيير الجريد هنا ليكون متجاوب على الموبايل */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 24,
                    padding: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 20,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    Temperature Variance
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.03)"
                        vertical={false}
                      />
                      <XAxis dataKey="time" hide minTickGap={30} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
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

                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 24,
                    padding: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 20,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    Water Consumption
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.03)"
                        vertical={false}
                      />
                      <XAxis dataKey="time" hide minTickGap={30} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
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
      </main>
    </div>
  );
}
