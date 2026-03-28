import { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  CheckCircle,
  ChevronRight,
  Leaf,
  Link,
  Lock,
  Tag,
  Loader2,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

type Step = 1 | 2 | 3;
const STEP_LABELS = ["Zone Info", "Firebase Setup", "Confirm"];

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 6, y: 70, size: 6, color: "var(--particle-3)", delay: 1.5 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
  { x: 50, y: 90, size: 5, color: "var(--particle-2)", delay: 2 },
  { x: 20, y: 85, size: 4, color: "var(--particle-1)", delay: 1.2 },
  { x: 75, y: 40, size: 6, color: "var(--particle-3)", delay: 1.8 },
];

function StepBar({ current }: { current: Step }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 36,
      }}
    >
      {STEP_LABELS.map((label, i) => {
        const step = (i + 1) as Step;
        const done = current > step;
        const active = current === step;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < 2 ? 1 : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: done
                    ? "var(--brand-600)"
                    : active
                      ? "var(--grad-brand)"
                      : "var(--step-inactive-bg)",
                  border: `2px solid ${done ? "var(--brand-600)" : active ? "var(--brand-500)" : "var(--border-base)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s",
                  flexShrink: 0,
                  boxShadow: active ? "0 0 16px rgba(74,222,128,0.3)" : "none",
                }}
              >
                {done ? (
                  <CheckCircle size={16} color="white" />
                ) : (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: active ? "white" : "var(--step-inactive-text)",
                    }}
                  >
                    {step}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: active
                    ? "var(--brand-500)"
                    : done
                      ? "var(--step-completed-text)"
                      : "var(--step-inactive-text)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < 2 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: done ? "var(--brand-600)" : "var(--border-base)",
                  margin: "0 8px",
                  marginBottom: 22,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InputField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
  error,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-secondary)",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: focused ? "var(--brand-500)" : "var(--text-faint)",
            transition: "color 0.2s",
            pointerEvents: "none",
          }}
        >
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "13px 14px 13px 42px",
            background: "var(--glass-bg)",
            border: `1.5px solid ${error ? "var(--error-color)" : focused ? "var(--brand-500)" : "var(--border-card)"}`,
            borderRadius: 14,
            color: "var(--text-primary)",
            fontSize: 14,
            fontWeight: 500,
            outline: "none",
            transition: "border 0.2s",
            opacity: disabled ? 0.5 : 1,
            boxShadow: focused ? "0 0 0 3px rgba(74,222,128,0.08)" : "none",
          }}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 12,
            color: "var(--error-color)",
            marginTop: 5,
            fontWeight: 500,
          }}
        >
          {error}
        </motion.p>
      )}
      {hint && !error && (
        <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function AddZone() {
  const plants = useQuery(api.Plants.getPlants);
  const addDevice = useMutation(api.devices.addDevice);
  const testConnection = useAction(api.devices.testConnection);
  const [scrolled, setScrolled] = useState(false);

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [firebaseUrl, setFirebaseUrl] = useState("");
  const [firebaseSecret, setFirebaseSecret] = useState("");
  const [plantId, setPlantId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "ok" | "warn" | "fail">(
    "idle",
  );
  const [saving, setSaving] = useState(false);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) e.name = "Zone name is required";
    else if (trimmed.length < 2) e.name = "Minimum 2 characters";
    else if (trimmed.length > 50) e.name = "Maximum 50 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    const url = firebaseUrl.trim();
    const secret = firebaseSecret.trim();
    if (!url) e.firebaseUrl = "Firebase URL is required";
    else if (
      !url.startsWith("https://") ||
      !url.includes("firebasedatabase.app")
    )
      e.firebaseUrl = "Must be a valid Firebase Realtime Database URL";
    if (!secret) e.firebaseSecret = "Firebase secret is required";
    else if (secret.length < 10) e.firebaseSecret = "Secret seems too short";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateStep2()) return;
    setTesting(true);
    setTestResult("idle");
    try {
      const result = await testConnection({
        firebaseUrl: firebaseUrl.trim().replace(/\/$/, ""),
        firebaseSecret: firebaseSecret.trim(),
      });
      if (result.success) {
        setTestResult(result.warning ? "warn" : "ok");
        if (result.warning) toast.warning(result.warning);
      } else {
        setTestResult("fail");
      }
    } catch {
      setTestResult("fail");
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await addDevice({
        name: name.trim(),
        firebaseUrl: firebaseUrl.trim().replace(/\/$/, ""),
        firebaseSecret: firebaseSecret.trim(),
        plantId: plantId ? (plantId as any) : undefined,
      });
      toast.success(`Zone "${name.trim()}" added successfully! 🌱`);
      nav("/dashboard");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add zone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main-gradient)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Background decorations */}
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
        {[640, 900].map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: d,
              height: d,
              top: "30%",
              left: "50%",
              transform: "translate(-50%,-50%)",
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

      {/* ── Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: scrolled ? "var(--header-scrolled-bg)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
          boxShadow: scrolled ? "var(--shadow-sm)" : "none",
          transition: "all 0.35s ease",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              step === 1 ? nav("/dashboard") : setStep((s) => (s - 1) as Step)
            }
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
              }}
            >
              Add Zone
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                letterSpacing: "0.04em",
              }}
            >
              Connect a new sensor zone
            </div>
          </div>
        </div>

        {/* Logo */}
        <motion.a
          href="/dashboard"
          whileHover={{ scale: 1.02 }}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <motion.div
            whileHover={{ rotate: [0, -7, 7, 0] }}
            transition={{ duration: 0.5 }}
            style={{ filter: "drop-shadow(0 4px 14px rgba(22,163,74,.30))" }}
          >
            <AgriSenseLogo size={34} />
          </motion.div>
          <span
            className="fd grad-text"
            style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.025em" }}
          >
            AgriSense
          </span>
        </motion.a>
      </header>

      {/* ── Main */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          style={{ width: "100%", maxWidth: 500 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <StepBar current={step} />

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border-card)",
              borderRadius: 24,
              padding: "32px",
              backdropFilter: "blur(20px)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        marginBottom: 6,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Name your zone
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                      Give this sensor zone a descriptive name so you can
                      identify it easily.
                    </p>
                  </div>

                  <InputField
                    label="Zone Name *"
                    icon={<Tag size={16} />}
                    value={name}
                    onChange={(v) => {
                      setName(v);
                      if (errors.name) setErrors((e) => ({ ...e, name: "" }));
                    }}
                    placeholder="e.g. Front Field, Zone A, Tomatoes..."
                    error={errors.name}
                    hint="Between 2 and 50 characters"
                  />

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-secondary)",
                        marginBottom: 8,
                      }}
                    >
                      Crop Type (optional)
                    </label>
                    <div style={{ position: "relative" }}>
                      <Leaf
                        size={16}
                        style={{
                          position: "absolute",
                          left: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-faint)",
                          pointerEvents: "none",
                        }}
                      />
                      <select
                        value={plantId}
                        onChange={(e) => setPlantId(e.target.value)}
                        style={{
                          ...inputStyle,
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 14px center",
                          backgroundSize: "16px",
                          paddingRight: "40px",
                          paddingLeft: "42px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">No crop selected</option>
                        {(plants ?? []).map((p: any) => (
                          <option key={p._id} value={p._id}>
                            {p.nameAr} ({p.name})
                          </option>
                        ))}
                      </select>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-faint)",
                        marginTop: 5,
                      }}
                    >
                      Used for smart irrigation recommendations
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        marginBottom: 6,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Firebase connection
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                      Enter your Firebase Realtime Database credentials to link
                      your sensor device.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "12px 16px",
                      background: "var(--info-bg)",
                      border: `1px solid var(--info-border)`,
                      borderRadius: 12,
                      fontSize: 13,
                      color: "var(--info-text)",
                      lineHeight: 1.6,
                    }}
                  >
                    💡 Find these in your Firebase console under{" "}
                    <strong>Realtime Database → Rules → Data</strong>
                  </div>

                  <InputField
                    label="Firebase Database URL *"
                    icon={<Link size={16} />}
                    value={firebaseUrl}
                    onChange={(v) => {
                      setFirebaseUrl(v);
                      setTestResult("idle");
                      if (errors.firebaseUrl)
                        setErrors((e) => ({ ...e, firebaseUrl: "" }));
                    }}
                    placeholder="https://your-project-default-rtdb...firebasedatabase.app"
                    error={errors.firebaseUrl}
                  />

                  <InputField
                    label="Database Secret *"
                    icon={<Lock size={16} />}
                    value={firebaseSecret}
                    onChange={(v) => {
                      setFirebaseSecret(v);
                      setTestResult("idle");
                      if (errors.firebaseSecret)
                        setErrors((e) => ({ ...e, firebaseSecret: "" }));
                    }}
                    placeholder="Your Firebase auth secret token"
                    type="password"
                    hint="Found in Firebase → Project Settings → Service Accounts → Database Secrets"
                    error={errors.firebaseSecret}
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTestConnection}
                    disabled={testing}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background:
                        testResult === "ok"
                          ? "var(--success-bg)"
                          : testResult === "fail"
                            ? "var(--error-bg)"
                            : testResult === "warn"
                              ? "var(--warning-bg)"
                              : "var(--info-bg)",
                      border: `1px solid ${
                        testResult === "ok"
                          ? "var(--success-border)"
                          : testResult === "fail"
                            ? "var(--error-border)"
                            : testResult === "warn"
                              ? "var(--warning-border)"
                              : "var(--info-border)"
                      }`,
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: testing ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity: testing ? 0.7 : 1,
                      transition: "all 0.2s",
                      color:
                        testResult === "ok"
                          ? "var(--success-color)"
                          : testResult === "fail"
                            ? "var(--error-color)"
                            : testResult === "warn"
                              ? "var(--warning-color)"
                              : "var(--info-color)",
                    }}
                  >
                    {testing ? (
                      <>
                        <Loader2
                          size={15}
                          style={{ animation: "spin 0.8s linear infinite" }}
                        />
                        Testing connection...
                      </>
                    ) : testResult === "ok" ? (
                      <>
                        <Wifi size={15} color="var(--success-color)" />
                        <span>Connected ✓</span>
                      </>
                    ) : testResult === "warn" ? (
                      <>
                        <Wifi size={15} color="var(--warning-color)" />
                        <span>Connected (no data yet)</span>
                      </>
                    ) : testResult === "fail" ? (
                      <>
                        <WifiOff size={15} />
                        <span>Connection failed — retry</span>
                      </>
                    ) : (
                      <>
                        <Wifi size={15} /> Test Connection
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        marginBottom: 6,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Confirm & save
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                      Review your zone details before saving.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {[
                      { label: "Zone Name", value: name.trim() },
                      {
                        label: "Firebase URL",
                        value:
                          firebaseUrl.trim().replace(/\/$/, "").slice(0, 48) +
                          "...",
                      },
                      { label: "Secret", value: "••••••••••••" },
                      {
                        label: "Crop Type",
                        value: plantId
                          ? ((plants ?? []).find((p: any) => p._id === plantId)
                              ?.name ?? "—")
                          : "None selected",
                      },
                    ].map((row, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          background: "var(--glass-bg)",
                          border: "1px solid var(--border-base)",
                          borderRadius: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--text-muted)",
                            fontWeight: 500,
                          }}
                        >
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--text-primary)",
                            fontWeight: 600,
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      padding: "12px 16px",
                      background: "var(--success-bg)",
                      border: `1px solid var(--success-border)`,
                      borderRadius: 12,
                      fontSize: 13,
                      color: "var(--success-color)",
                      lineHeight: 1.6,
                    }}
                  >
                    Your zone will start syncing sensor data every 30 seconds
                    automatically.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--border-card)",
                    borderRadius: 14,
                    color: "var(--text-muted)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <motion.button
                  whileHover={{
                    scale: 1.015,
                    boxShadow: "0 8px 28px rgba(22,163,74,0.3)",
                  }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "var(--grad-brand)",
                    border: "none",
                    borderRadius: 14,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  Continue <ChevronRight size={16} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{
                    scale: 1.015,
                    boxShadow: "0 8px 28px rgba(22,163,74,0.35)",
                  }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "var(--grad-brand)",
                    border: "none",
                    borderRadius: 14,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={15}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} /> Save Zone
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Add this at the very end of the file, outside the component
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px 13px 42px",
  background: "var(--glass-bg)",
  border: "1.5px solid var(--border-card)",
  borderRadius: 14,
  color: "var(--text-primary)",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  transition: "all 0.2s",
};
