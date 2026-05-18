﻿﻿import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  Leaf,
  Ruler,
  CalendarDays,
  FileText,
  Droplets,
  Thermometer,
  Trash2,
  Save,
  AlertTriangle,
  Code2,
  Power,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 6, y: 70, size: 6, color: "var(--particle-3)", delay: 1.5 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
  { x: 75, y: 40, size: 6, color: "var(--particle-3)", delay: 1.8 },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function resolveCurrentCropWeek(cropStartedAt?: number, createdAt?: number) {
  const anchor = cropStartedAt ?? createdAt ?? Date.now();
  return Math.max(1, Math.floor((Date.now() - anchor) / WEEK_MS) + 1);
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

export default function DeviceSettings({
  deviceId,
}: {
  deviceId: string | null;
}) {
  const device = useQuery(
    api.devices.getDevice,
    deviceId ? { deviceId: deviceId as Id<"devices"> } : "skip",
  );
  const plants = useQuery(api.plants.getPlants);
  const updateDevice = useMutation(api.devices.updateDevice);
  const deleteDevice = useMutation(api.devices.deleteDevice);
  const fetchReading = useAction(api.readings.fetchAndSaveReading);

  const [scrolled, setScrolled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState<string | null>(null);
  const [plantId, setPlantId] = useState<string | null>(null);
  const [initialCropWeek, setInitialCropWeek] = useState<string | null>(null);
  const [areaM2, setAreaM2] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [customMinMoisture, setCustomMinMoisture] = useState<string | null>(
    null,
  );
  const [customMaxMoisture, setCustomMaxMoisture] = useState<string | null>(
    null,
  );
  const [customOptimalTemp, setCustomOptimalTemp] = useState<string | null>(
    null,
  );
  const [simMoisture, setSimMoisture] = useState("45");
  const [simTemperature, setSimTemperature] = useState("25");
  const [simFlowRate, setSimFlowRate] = useState("1.5");
  const [simPumpStatus, setSimPumpStatus] = useState<"on" | "off">("off");
  const [applyingSimulation, setApplyingSimulation] = useState(false);

  const getVal = (state: string | null, field: any) =>
    state !== null ? state : (field ?? "");

  useEffect(() => {
    if (device) {
      setName(device.name);
      setPlantId(device.plantId ?? "");
      setInitialCropWeek(
        resolveCurrentCropWeek(
          device.cropStartedAt,
          device.createdAt,
        ).toString(),
      );
      setAreaM2(device.areaM2?.toString() ?? "");
      setNotes(device.notes ?? "");
      setCustomMinMoisture(device.customMinMoisture?.toString() ?? "");
      setCustomMaxMoisture(device.customMaxMoisture?.toString() ?? "");
      setCustomOptimalTemp(device.customOptimalTemp?.toString() ?? "");
      setSimMoisture((device as any).simulationMoisture?.toString() ?? "45");
      setSimTemperature(
        (device as any).simulationTemperature?.toString() ?? "25",
      );
      setSimFlowRate((device as any).simulationFlowRate?.toString() ?? "1.5");
      setSimPumpStatus((device as any).simulationPumpStatus ? "on" : "off");
    }
  }, [device]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  if (!deviceId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-page)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-primary)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>âš ï¸</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            No device selected
          </div>
          <button
            onClick={() => nav("/dashboard")}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              background: "var(--grad-brand)",
              border: "none",
              borderRadius: 12,
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (device === undefined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-page)",
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleSave = async () => {
    if (!device) return;
    setSaving(true);
    try {
      await updateDevice({
        deviceId: device._id,
        name: name?.trim() || device.name,
        plantId: plantId ? (plantId as Id<"plants">) : undefined,
        initialCropWeek: plantId
          ? Math.max(1, Number(initialCropWeek || "1"))
          : undefined,
        areaM2: areaM2 ? Number(areaM2) : undefined,
        notes: notes?.trim() || undefined,
        customMinMoisture: customMinMoisture
          ? Number(customMinMoisture)
          : undefined,
        customMaxMoisture: customMaxMoisture
          ? Number(customMaxMoisture)
          : undefined,
        customOptimalTemp: customOptimalTemp
          ? Number(customOptimalTemp)
          : undefined,
      });
      showCleanToast(
        "Settings Saved",
        "Zone configuration updated successfully",
        "success",
      );
    } catch (err: any) {
      showCleanErrorToast(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!device) return;
    setDeleting(true);
    try {
      await deleteDevice({ deviceId: device._id });
      showCleanToast(
        "Zone Deleted",
        `"${device.name}" has been removed`,
        "success",
      );
      nav("/dashboard");
    } catch (err: any) {
      showCleanErrorToast(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSimulationMode = async () => {
    if (!device) return;
    const enable = !device.isSimulationMode;
    try {
      await updateDevice({
        deviceId: device._id,
        isSimulationMode: enable,
      });
      await fetchReading({ deviceId: device._id });
      showCleanToast(
        enable ? "Simulation Mode Enabled" : "Simulation Mode Disabled",
        enable
          ? "You can now control mock readings manually."
          : "Live Firebase readings resumed.",
        "success",
      );
    } catch (e) {
      showCleanErrorToast(e);
    }
  };

  const applyManualSimulationReading = async () => {
    if (!device || !device.isSimulationMode) return;

    const moisture = Number(simMoisture);
    const temperature = Number(simTemperature);
    const flowRate = Number(simFlowRate);
    const normalizedFlowRate = simPumpStatus === "off" ? 0 : flowRate;

    if (
      !Number.isFinite(moisture) ||
      !Number.isFinite(temperature) ||
      !Number.isFinite(normalizedFlowRate)
    ) {
      showCleanToast("Invalid values", "Please enter valid numbers", "warning");
      return;
    }

    setApplyingSimulation(true);
    try {
      await updateDevice({
        deviceId: device._id,
        freezeSimulationReadings: true,
        simulationMoisture: Math.max(0, Math.min(100, moisture)),
        simulationTemperature: Math.max(-20, Math.min(85, temperature)),
        simulationFlowRate: Math.max(0, normalizedFlowRate),
        simulationPumpStatus: simPumpStatus === "on",
      });
      await fetchReading({ deviceId: device._id });
      showCleanToast(
        "Manual simulation applied",
        "Custom readings are now active.",
        "success",
      );
    } catch (e) {
      showCleanErrorToast(e);
    } finally {
      setApplyingSimulation(false);
    }
  };

  const clearManualSimulationReading = async () => {
    if (!device || !device.isSimulationMode) return;
    setApplyingSimulation(true);
    try {
      await updateDevice({
        deviceId: device._id,
        freezeSimulationReadings: false,
      });
      await fetchReading({ deviceId: device._id });
      showCleanToast(
        "Auto simulation restored",
        "Readings are generated automatically again.",
        "success",
      );
    } catch (e) {
      showCleanErrorToast(e);
    } finally {
      setApplyingSimulation(false);
    }
  };

  const selectedPlant = (plants ?? []).find(
    (p: any) => p._id === (plantId ?? device.plantId),
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main-gradient)",
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
                <Settings size={15} style={{ color: "var(--brand-500)" }} />
                {device.name} Settings
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  letterSpacing: "0.04em",
                }}
              >
                Zone configuration
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

      {/* Main */}
      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* â”€â”€ Zone Info */}
        <Section title="Zone Info" icon={<FileText size={16} />}>
          <Field label="Zone Name">
            <input
              value={name ?? device.name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Zone name"
            />
          </Field>
          <Field label="Crop Type">
            <select
              value={plantId ?? device.plantId ?? ""}
              onChange={(e) => setPlantId(e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
            >
              <option
                value=""
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                No crop selected
              </option>
              {(plants ?? []).map((p: any) => (
                <option
                  key={p._id}
                  value={p._id}
                  style={{ color: "#111827", backgroundColor: "#ffffff" }}
                >
                  {p.name} - {p.nameAr}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Current Crop Week"
            hint={
              plantId
                ? "Adjust this if the crop was planted before this zone was created"
                : "Select a crop type first"
            }
          >
            <div style={{ position: "relative" }}>
              <CalendarDays
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-faint)",
                }}
              />
              <input
                type="number"
                min={1}
                max={104}
                value={initialCropWeek ?? "1"}
                onChange={(e) => setInitialCropWeek(e.target.value)}
                disabled={!plantId}
                style={{
                  ...inputStyle,
                  paddingLeft: 36,
                  opacity: plantId ? 1 : 0.55,
                }}
                placeholder="1"
              />
            </div>
          </Field>
          <Field
            label="Zone Area (m2)"
            hint="Used to calculate water consumption"
          >
            <input
              type="number"
              value={areaM2 ?? device.areaM2?.toString() ?? ""}
              onChange={(e) => setAreaM2(e.target.value)}
              style={inputStyle}
              placeholder="e.g. 500"
              min={0}
            />
          </Field>
          <Field label="Notes" hint="Optional description">
            <textarea
              value={notes ?? device.notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, height: 80, resize: "none" }}
              placeholder="Any notes about this zone..."
            />
          </Field>
        </Section>

        {/* â”€â”€ Smart Thresholds */}
        <Section
          title="Smart Thresholds"
          icon={<Droplets size={16} />}
          subtitle={
            selectedPlant
              ? `Defaults from ${selectedPlant.name}`
              : "Custom alert limits"
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
            }}
          >
            <Field
              label="Min Moisture (%)"
              hint={
                selectedPlant
                  ? `Plant default: ${selectedPlant.minMoisture}%`
                  : undefined
              }
            >
              <input
                type="number"
                min={0}
                max={100}
                value={
                  customMinMoisture ??
                  device.customMinMoisture?.toString() ??
                  ""
                }
                onChange={(e) => setCustomMinMoisture(e.target.value)}
                style={inputStyle}
                placeholder={selectedPlant?.minMoisture?.toString() ?? "30"}
              />
            </Field>
            <Field
              label="Max Moisture (%)"
              hint={
                selectedPlant
                  ? `Plant default: ${selectedPlant.maxMoisture}%`
                  : undefined
              }
            >
              <input
                type="number"
                min={0}
                max={100}
                value={
                  customMaxMoisture ??
                  device.customMaxMoisture?.toString() ??
                  ""
                }
                onChange={(e) => setCustomMaxMoisture(e.target.value)}
                style={inputStyle}
                placeholder={selectedPlant?.maxMoisture?.toString() ?? "70"}
              />
            </Field>
          </div>
          <Field
            label="Optimal Temperature (Â°C)"
            hint={
              selectedPlant
                ? `Plant default: ${selectedPlant.optimalTemp}Â°C`
                : undefined
            }
          >
            <input
              type="number"
              min={0}
              max={60}
              value={
                customOptimalTemp ?? device.customOptimalTemp?.toString() ?? ""
              }
              onChange={(e) => setCustomOptimalTemp(e.target.value)}
              style={inputStyle}
              placeholder={selectedPlant?.optimalTemp?.toString() ?? "25"}
            />
          </Field>
        </Section>

        {/* ── Developer Tools ── */}
        <Section title="Developer Tools" icon={<Code2 size={16} />}>
          <Field
            label="Simulation Mode"
            hint="Disables Firebase polling and relies solely on fake test data. Lifecycle events will not be triggered."
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={handleToggleSimulationMode}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: device.isSimulationMode
                    ? "#f59e0b"
                    : "var(--glass-bg)",
                  color: device.isSimulationMode
                    ? "#fff"
                    : "var(--text-primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  border: device.isSimulationMode
                    ? "none"
                    : "1px solid var(--border-card)",
                  transition: "all 0.2s",
                }}
              >
                {device.isSimulationMode
                  ? "Simulation Active"
                  : "Enable Simulation"}
              </button>
            </div>
          </Field>

          {device.isSimulationMode && (
            <>
              <Field
                label="Manual Simulation Reading"
                hint="Set moisture, temperature, flow and pump status exactly as you want."
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 10,
                  }}
                >
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={simMoisture}
                    onChange={(e) => setSimMoisture(e.target.value)}
                    style={inputStyle}
                    placeholder="Moisture %"
                  />
                  <input
                    type="number"
                    value={simTemperature}
                    onChange={(e) => setSimTemperature(e.target.value)}
                    style={inputStyle}
                    placeholder="Temp °C"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={simFlowRate}
                    onChange={(e) => setSimFlowRate(e.target.value)}
                    disabled={simPumpStatus === "off"}
                    style={{
                      ...inputStyle,
                      opacity: simPumpStatus === "off" ? 0.6 : 1,
                      cursor: simPumpStatus === "off" ? "not-allowed" : "text",
                    }}
                    placeholder="Flow L/min"
                  />
                </div>
              </Field>

              <Field
                label="Pump Status"
                hint="When set to OFF, saved flow will be forced to 0 for consistency."
              >
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      setSimPumpStatus("on");
                      if (!Number.isFinite(Number(simFlowRate)) || Number(simFlowRate) <= 0) {
                        setSimFlowRate("1.5");
                      }
                    }}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 10,
                      border:
                        simPumpStatus === "on"
                          ? "1px solid #22c55e"
                          : "1px solid var(--border-card)",
                      background:
                        simPumpStatus === "on"
                          ? "rgba(34,197,94,0.18)"
                          : "var(--glass-bg)",
                      color:
                        simPumpStatus === "on"
                          ? "#86efac"
                          : "var(--text-primary)",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Power size={14} style={{ marginRight: 6 }} /> ON
                  </button>
                  <button
                    onClick={() => {
                      setSimPumpStatus("off");
                      setSimFlowRate("0");
                    }}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 10,
                      border:
                        simPumpStatus === "off"
                          ? "1px solid #f87171"
                          : "1px solid var(--border-card)",
                      background:
                        simPumpStatus === "off"
                          ? "rgba(248,113,113,0.16)"
                          : "var(--glass-bg)",
                      color:
                        simPumpStatus === "off"
                          ? "#fda4af"
                          : "var(--text-primary)",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Power size={14} style={{ marginRight: 6 }} /> OFF
                  </button>
                </div>
              </Field>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={applyManualSimulationReading}
                  disabled={applyingSimulation}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(34,197,94,0.4)",
                    background: "rgba(34,197,94,0.16)",
                    color: "#86efac",
                    fontWeight: 700,
                    cursor: applyingSimulation ? "not-allowed" : "pointer",
                    opacity: applyingSimulation ? 0.7 : 1,
                  }}
                >
                  {applyingSimulation ? "Applying..." : "Apply Manual Reading"}
                </button>
                <button
                  onClick={clearManualSimulationReading}
                  disabled={applyingSimulation}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border-card)",
                    background: "var(--glass-bg)",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    cursor: applyingSimulation ? "not-allowed" : "pointer",
                    opacity: applyingSimulation ? 0.7 : 1,
                  }}
                >
                  Use Auto Simulation
                </button>
              </div>
            </>
          )}
        </Section>

        {/* â”€â”€ Connection Info (read only) */}
        <Section title="Connection" icon={<Settings size={16} />}>
          <Field label="Device ID (For Testing/API)">
            <div
              style={{
                ...inputStyle,
                color: "var(--text-muted)",
                cursor: "text",
                userSelect: "all",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "monospace",
              }}
              title="Double click to select and copy"
            >
              {device._id}
            </div>
          </Field>
          <Field label="Firebase URL">
            <div
              style={{
                ...inputStyle,
                color: "var(--text-muted)",
                cursor: "default",
                userSelect: "all",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {device.firebaseUrl}
            </div>
          </Field>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "var(--success-bg)",
              border: `1px solid var(--success-border)`,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: device.isActive ? "#4ade80" : "#6b7280",
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: device.isActive ? "#4ade80" : "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              {device.isActive ? "Active" : "Inactive"}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-faint)",
                marginLeft: "auto",
              }}
            >
              Created{" "}
              {device.createdAt
                ? new Date(device.createdAt).toLocaleDateString()
                : "Unknown"}
            </span>
          </div>
        </Section>

        {/* â”€â”€ Save Button */}
        <motion.button
          whileHover={{
            scale: 1.02,
            boxShadow: "0 8px 28px rgba(22,163,74,0.3)",
          }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px",
            background: "var(--grad-brand)",
            border: "none",
            borderRadius: 16,
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <>
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} /> Save Changes
            </>
          )}
        </motion.button>

        {/* â”€â”€ Danger Zone */}
        <Section title="Danger Zone" icon={<AlertTriangle size={16} />} danger>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 14,
              lineHeight: 1.6,
            }}
          >
            Deleting this zone will permanently remove all sensor readings and
            history. This cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 12,
                color: "#f87171",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Trash2 size={15} /> Delete Zone
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#f87171",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Are you sure? This will delete "{device.name}" and all its
                  data.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1,
                      padding: "11px",
                      background: "var(--glass-bg)",
                      border: "1px solid var(--border-card)",
                      borderRadius: 12,
                      color: "var(--text-muted)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      flex: 1,
                      padding: "11px",
                      background: "rgba(248,113,113,0.15)",
                      border: "1px solid rgba(248,113,113,0.4)",
                      borderRadius: 12,
                      color: "#f87171",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: deleting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {deleting ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 size={14} /> Yes, Delete
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  icon,
  subtitle,
  danger,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "var(--border-card)"}`,
        borderRadius: 20,
        padding: "24px",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ color: danger ? "#f87171" : "var(--brand-500)" }}>
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: danger ? "#f87171" : "var(--text-primary)",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-secondary)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "var(--glass-bg)",
  border: "1.5px solid var(--border-card)",
  borderRadius: 12,
  color: "var(--text-primary)",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  fontFamily: "var(--font-body)",
};
