import { useState, useEffect, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  Droplets,
  Thermometer,
  Wind,
  Power,
  Activity,
  BarChart2,
  Radio,
  Bell,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { AgriSenseLogo } from "../components/Logo";

import { LiveCard } from "../components/dashboard/LiveCard";
import { CustomTooltip } from "../components/dashboard/CustomTooltip";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

type Tab = "live" | "trends" | "alerts";

function getMoistureStatus(v: number, min = 30, max = 70) {
  if (v < min) return { label: "Dry", color: "#f87171" };
  if (v <= max) return { label: "Optimal", color: "#4ade80" };
  return { label: "Wet", color: "#60a5fa" };
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function DeviceDetails({
  deviceId,
}: {
  deviceId: string | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [scrolled, setScrolled] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);

  const device = useQuery(
    api.devices.getDevice,
    deviceId ? { deviceId: deviceId as Id<"devices"> } : "skip",
  );
  const latest = useQuery(
    api.readings.getLatestReading,
    deviceId ? { deviceId: deviceId as Id<"devices"> } : "skip",
  );
  const readings24h = useQuery(
    api.readings.getReadings24h,
    deviceId ? { deviceId: deviceId as Id<"devices"> } : "skip",
  );
  const fetchReading = useAction(api.readings.fetchAndSaveReading);
  const controlPump = useAction(api.readings.controlPump);

  const refresh = useCallback(async () => {
    if (deviceId) {
      try {
        await fetchReading({ deviceId: deviceId as Id<"devices"> });
      } catch {}
    }
  }, [deviceId, fetchReading]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handlePump = async () => {
    if (!latest || !deviceId) return;
    setPumpLoading(true);
    try {
      await controlPump({
        deviceId: deviceId as Id<"devices">,
        state: !latest.pumpStatus,
      });
      await refresh();
      toast.success(
        `Pump ${!latest.pumpStatus ? "started" : "stopped"} manually`,
      );
    } catch {
      toast.error("Failed to control pump");
    } finally {
      setPumpLoading(false);
    }
  };

  if (!deviceId || device === undefined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#070d09",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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

  const chartData = (readings24h ?? []).map((r) => ({
    time: fmt(r.timestamp),
    moisture: r.moisture,
    temperature: r.temperature,
    flow: r.flowRate,
  }));

  const minMoist = device?.customMinMoisture ?? 30;
  const maxMoist = device?.customMaxMoisture ?? 70;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 100% 80% at 50% -5%, #0f2b18 0%, #0b1e24 40%, #070d09 70%)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(7,13,9,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(32px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
          transition: "all 0.35s ease",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
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
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {device.name}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: device.isActive ? "#4ade80" : "#f87171",
                    boxShadow: device.isActive ? "0 0 8px #4ade80" : "none",
                  }}
                  title={device.isActive ? "Online" : "Offline"}
                />
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-faint)",
                  marginTop: 2,
                }}
              >
                {device.areaM2
                  ? `${device.areaM2} m² Zone`
                  : "Sensor Zone Details"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => nav(`/device-settings?id=${device._id}`)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                color: "var(--text-muted)",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Settings size={14} /> Settings
            </motion.button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Tabs Navigation */}
        <div
          style={{
            display: "flex",
            gap: 8,
            background: "rgba(255,255,255,0.03)",
            padding: 6,
            borderRadius: 16,
            border: "1px solid var(--border-card)",
            width: "fit-content",
          }}
        >
          {(["live", "trends", "alerts"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 20px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                textTransform: "capitalize",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                background:
                  activeTab === tab ? "var(--brand-600)" : "transparent",
                color: activeTab === tab ? "white" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tab === "live" && <Radio size={14} />}
              {tab === "trends" && <BarChart2 size={14} />}
              {tab === "alerts" && <Bell size={14} />}
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/*  TAB: LIVE & CONTROL */}
          {activeTab === "live" && latest && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              <LiveCard
                icon={<Droplets size={18} />}
                label="Soil Moisture"
                value={latest.moisture}
                unit="%"
                status={getMoistureStatus(latest.moisture, minMoist, maxMoist)}
                color="#38bdf8"
                max={100}
                delay={0}
              />
              <LiveCard
                icon={<Thermometer size={18} />}
                label="Temperature"
                value={latest.temperature}
                unit="°C"
                status={{ label: "Live", color: "#fbbf24" }}
                color="#fbbf24"
                max={60}
                delay={0.1}
              />

              {/* Pump Control Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${latest.pumpStatus ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 20,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: latest.pumpStatus
                          ? "rgba(74,222,128,0.15)"
                          : "rgba(107,114,128,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: latest.pumpStatus ? "#4ade80" : "#6b7280",
                      }}
                    >
                      <Power size={20} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-faint)",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Irrigation Pump
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: latest.pumpStatus ? "#4ade80" : "#e8f5e9",
                        }}
                      >
                        {latest.pumpStatus ? "RUNNING" : "OFF"}
                      </div>
                    </div>
                  </div>

                  {/* Big Toggle Switch */}
                  <div
                    style={{
                      width: 56,
                      height: 30,
                      borderRadius: 15,
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
                        top: 3,
                        left: latest.pumpStatus ? 29 : 3,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "white",
                        transition: "left 0.3s",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 12,
                    fontSize: 13,
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Activity size={14} color="var(--brand-500)" /> Current flow
                  rate:{" "}
                  <strong style={{ color: "white" }}>
                    {latest.flowRate} L/min
                  </strong>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/*  TAB: TRENDS */}
          {activeTab === "trends" && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-card)",
                  borderRadius: 20,
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    marginBottom: 20,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Droplets size={16} color="#38bdf8" /> Moisture History
                      (24h)
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-faint)",
                        marginTop: 4,
                      }}
                    >
                      Showing custom thresholds for this zone
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
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
                      y={minMoist}
                      stroke="#f87171"
                      strokeDasharray="4 4"
                      strokeOpacity={0.5}
                      label={{
                        value: "Min",
                        fill: "#f87171",
                        fontSize: 10,
                        position: "insideTopLeft",
                      }}
                    />
                    <ReferenceLine
                      y={maxMoist}
                      stroke="#60a5fa"
                      strokeDasharray="4 4"
                      strokeOpacity={0.5}
                      label={{
                        value: "Max",
                        fill: "#60a5fa",
                        fontSize: 10,
                        position: "insideBottomLeft",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moisture"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={false}
                      name="Moisture"
                      unit="%"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/*  TAB: ALERTS (Placeholder for now until events are fully wired) */}
          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-card)",
                borderRadius: 20,
                padding: "40px",
                textAlign: "center",
              }}
            >
              <Bell
                size={32}
                color="rgba(255,255,255,0.2)"
                style={{ margin: "0 auto 16px" }}
              />
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                No recent alerts
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginTop: 6,
                }}
              >
                Everything is running smoothly in this zone.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
