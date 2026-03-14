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

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Zone Info", "Firebase Setup", "Confirm"];

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
                    ? "#16a34a"
                    : active
                      ? "linear-gradient(135deg,#16a34a,#0ea5e9)"
                      : "rgba(255,255,255,0.06)",
                  border: `2px solid ${done ? "#16a34a" : active ? "#4ade80" : "rgba(255,255,255,0.1)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s",
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <CheckCircle size={16} color="white" />
                ) : (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: active ? "white" : "rgba(255,255,255,0.3)",
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
                    ? "#4ade80"
                    : done
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(255,255,255,0.25)",
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
                  background: done ? "#16a34a" : "rgba(255,255,255,0.08)",
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
          color: "rgba(255,255,255,0.7)",
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
            color: focused ? "#4ade80" : "rgba(255,255,255,0.25)",
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
            background: "rgba(255,255,255,0.04)",
            border: `1.5px solid ${error ? "#f87171" : focused ? "#4ade80" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 14,
            color: "#e8f5e9",
            fontSize: 14,
            fontWeight: 500,
            outline: "none",
            transition: "border 0.2s",
            opacity: disabled ? 0.5 : 1,
          }}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 12,
            color: "#f87171",
            marginTop: 5,
            fontWeight: 500,
          }}
        >
          {error}
        </motion.p>
      )}
      {hint && !error && (
        <p
          style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 5 }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export default function AddZone() {
  const plants = useQuery(api.plants.getPlants);
  const addDevice = useMutation(api.devices.addDevice);
  const testConnection = useAction(api.devices.testConnection);

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
    ) {
      e.firebaseUrl = "Must be a valid Firebase Realtime Database URL";
    }
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
        else toast.success("Connected successfully!");
      } else {
        setTestResult("fail");
        toast.error(result.error ?? "Connection failed");
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
        background: "#070d09",
        color: "#e8f5e9",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(7,13,9,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button
          onClick={() =>
            step === 1 ? nav("/dashboard") : setStep((s) => (s - 1) as Step)
          }
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
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e8f5e9" }}>
            Add Zone
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            Connect a new sensor zone
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <motion.div
          style={{ width: "100%", maxWidth: 480 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <StepBar current={step} />

          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 24,
              padding: "32px",
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
                        fontSize: 20,
                        fontWeight: 800,
                        color: "#e8f5e9",
                        marginBottom: 6,
                      }}
                    >
                      Name your zone
                    </h2>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
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
                        color: "rgba(255,255,255,0.7)",
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
                          color: "rgba(255,255,255,0.25)",
                          pointerEvents: "none",
                        }}
                      />
                      <select
                        value={plantId}
                        onChange={(e) => setPlantId(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "13px 14px 13px 42px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1.5px solid rgba(255,255,255,0.1)",
                          borderRadius: 14,
                          color: plantId ? "#e8f5e9" : "rgba(255,255,255,0.3)",
                          fontSize: 14,
                          fontWeight: 500,
                          outline: "none",
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">No crop selected</option>
                        {(plants ?? []).map((p) => (
                          <option
                            key={p._id}
                            value={p._id}
                            style={{ background: "#0f1f12" }}
                          >
                            {p.name} — {p.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.3)",
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
                        fontSize: 20,
                        fontWeight: 800,
                        color: "#e8f5e9",
                        marginBottom: 6,
                      }}
                    >
                      Firebase connection
                    </h2>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                      Enter your Firebase Realtime Database credentials to link
                      your sensor device.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "12px 16px",
                      background: "rgba(56,189,248,0.06)",
                      border: "1px solid rgba(56,189,248,0.15)",
                      borderRadius: 12,
                      fontSize: 13,
                      color: "rgba(147,210,255,0.8)",
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

                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "rgba(56,189,248,0.08)",
                      border: "1px solid rgba(56,189,248,0.2)",
                      borderRadius: 12,
                      color: "#7dd3fc",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: testing ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity: testing ? 0.7 : 1,
                      transition: "all 0.2s",
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
                        <Wifi size={15} color="#4ade80" />
                        <span style={{ color: "#4ade80" }}>Connected ✓</span>
                      </>
                    ) : testResult === "warn" ? (
                      <>
                        <Wifi size={15} color="#fbbf24" />
                        <span style={{ color: "#fbbf24" }}>
                          Connected (no data yet)
                        </span>
                      </>
                    ) : testResult === "fail" ? (
                      <>
                        <WifiOff size={15} color="#f87171" />
                        <span style={{ color: "#f87171" }}>
                          Connection failed — retry
                        </span>
                      </>
                    ) : (
                      <>
                        <Wifi size={15} /> Test Connection
                      </>
                    )}
                  </button>
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
                        fontSize: 20,
                        fontWeight: 800,
                        color: "#e8f5e9",
                        marginBottom: 6,
                      }}
                    >
                      Confirm & save
                    </h2>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
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
                          ? ((plants ?? []).find((p) => p._id === plantId)
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
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.4)",
                            fontWeight: 500,
                          }}
                        >
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "#e8f5e9",
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
                      background: "rgba(74,222,128,0.06)",
                      border: "1px solid rgba(74,222,128,0.15)",
                      borderRadius: 12,
                      fontSize: 13,
                      color: "rgba(134,239,172,0.8)",
                      lineHeight: 1.6,
                    }}
                  >
                    ✅ Your zone will start syncing sensor data every 30 seconds
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
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    color: "rgba(255,255,255,0.6)",
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
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
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
                    background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
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
