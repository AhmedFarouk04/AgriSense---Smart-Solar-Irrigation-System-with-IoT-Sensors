import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  Leaf,
  Ruler,
  FileText,
  Droplets,
  Thermometer,
  Trash2,
  Save,
  AlertTriangle,
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

export default function DeviceSettings({
  deviceId,
}: {
  deviceId: string | null;
}) {
  const device = useQuery(
    api.devices.getDevice,
    deviceId ? { deviceId: deviceId as Id<"devices"> } : "skip",
  );
  const plants = useQuery(api.Plants.getPlants);
  const updateDevice = useMutation(api.devices.updateDevice);
  const deleteDevice = useMutation(api.devices.deleteDevice);

  const [scrolled, setScrolled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState<string | null>(null);
  const [plantId, setPlantId] = useState<string | null>(null);
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

  // Init form من الـ device data
  const getVal = (state: string | null, field: any) =>
    state !== null ? state : (field ?? "");

  useEffect(() => {
    if (device) {
      setName(device.name);
      setPlantId(device.plantId ?? "");
      setAreaM2(device.areaM2?.toString() ?? "");
      setNotes(device.notes ?? "");
      setCustomMinMoisture(device.customMinMoisture?.toString() ?? "");
      setCustomMaxMoisture(device.customMaxMoisture?.toString() ?? "");
      setCustomOptimalTemp(device.customOptimalTemp?.toString() ?? "");
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
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
      toast.success("Zone settings saved! ✅");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!device) return;
    setDeleting(true);
    try {
      await deleteDevice({ deviceId: device._id });
      toast.success(`Zone "${device.name}" deleted`);
      nav("/dashboard");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete");
    } finally {
      setDeleting(false);
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
        {/* ── Zone Info */}
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
              style={inputStyle}
            >
              <option value="">No crop selected</option>
              {(plants ?? []).map((p: any) => (
                <option
                  key={p._id}
                  value={p._id}
                  style={{ background: "#0f1f12" }}
                >
                  {p.name} — {p.nameAr}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Zone Area (m²)"
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

        {/* ── Smart Thresholds */}
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
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
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
            label="Optimal Temperature (°C)"
            hint={
              selectedPlant
                ? `Plant default: ${selectedPlant.optimalTemp}°C`
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

        {/* ── Connection Info (read only) */}
        <Section title="Connection" icon={<Settings size={16} />}>
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
              Created {new Date(device.createdAt).toLocaleDateString()}
            </span>
          </div>
        </Section>

        {/* ── Save Button */}
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

        {/* ── Danger Zone */}
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

// ── Helper Components
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
