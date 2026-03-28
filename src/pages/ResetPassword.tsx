import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const StrengthRow = ({ label, valid }: { label: string; valid: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    {valid ? (
      <CheckCircle2
        style={{
          width: 14,
          height: 14,
          color: "var(--success-color)",
          flexShrink: 0,
        }}
      />
    ) : (
      <XCircle
        style={{
          width: 14,
          height: 14,
          color: "var(--text-faint)",
          flexShrink: 0,
        }}
      />
    )}
    <span
      style={{
        fontSize: 12,
        color: valid ? "var(--success-color)" : "var(--text-muted)",
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  </div>
);

export default function ResetPassword() {
  const resetPasswordMutation = useMutation(api.authHelpers.resetPassword);
  const verifyResetCode = useMutation(api.authHelpers.verifyResetCode);
  const requestReset = useMutation(api.authHelpers.requestPasswordReset);

  const [step, setStep] = useState<1 | 2>(1);
  const email = sessionStorage.getItem("resetEmail") || "";

  // Step 1
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 2
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passError, setPassError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const filled = codeDigits.filter(Boolean).length;

  useEffect(() => {
    if (step === 1) refs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const ps = {
    length: newPassword.length >= 8,
    number: /\d/.test(newPassword),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
  };
  const psValid = Object.values(ps).every(Boolean);

  const handleDigitChange = (i: number, val: string) => {
    if (codeError) setCodeError("");
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6);
      const nc = [...codeDigits];
      digits.split("").forEach((d, j) => {
        if (j < 6) nc[j] = d;
      });
      setCodeDigits(nc);
      refs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    if (!/^\d*$/.test(val)) return;
    const nc = [...codeDigits];
    nc[i] = val;
    setCodeDigits(nc);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleDigitKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[i] && i > 0)
      refs.current[i - 1]?.focus();
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (filled !== 6) return;
    setVerifyingCode(true);
    try {
      await verifyResetCode({ email, code: codeDigits.join("") });
      setStep(2);
    } catch (error: any) {
      const msg = error?.message ?? "";
      if (msg.includes("expired")) {
        setCodeError("Code expired — request a new one below");
      } else {
        setCodeError("Invalid code — please try again");
      }
      setCodeDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setResendLoading(true);
    try {
      await requestReset({ email });
      setCodeDigits(["", "", "", "", "", ""]);
      setCodeError("");
      setResendCooldown(60);
      refs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend code. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!psValid) {
      setPassError("Password does not meet all requirements");
      valid = false;
    } else {
      setPassError("");
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      valid = false;
    } else {
      setConfirmError("");
    }
    if (!valid) return;

    setLoading(true);
    try {
      await resetPasswordMutation({
        email,
        code: codeDigits.join(""),
        newPassword,
      });
      sessionStorage.removeItem("resetEmail");
      setCompleted(true);

      setTimeout(() => nav("/login"), 2000);
    } catch (error: any) {
      const msg = error?.message ?? "";
      if (msg.includes("expired")) {
        setStep(1);
        setCodeDigits(["", "", "", "", "", ""]);
        setCodeError("Code expired — request a new one below");
      } else if (msg.includes("Invalid") || msg.includes("invalid")) {
        setStep(1);
        setCodeDigits(["", "", "", "", "", ""]);
        setCodeError("Invalid code — please try again");
      } else {
        toast.error("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px 13px 44px",
    background: "var(--bg-card)",
    borderRadius: 16,
    outline: "none",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-primary)",
    transition: "border .2s",
  };

  if (completed)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-main-gradient)" }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="text-center p-14 rounded-3xl"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 0.7 }}
            className="w-28 h-28 mx-auto mb-6 rounded-3xl flex items-center justify-center"
            style={{
              background: "var(--grad-brand)",
              boxShadow: "0 24px 56px rgba(22,163,74,0.40)",
            }}
          >
            <CheckCircle className="w-14 h-14 text-white" />
          </motion.div>
          <h2
            className="text-4xl font-black mb-2"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              color: "var(--text-primary)",
            }}
          >
            Password Reset! 🔐
          </h2>
          <p style={{ color: "var(--text-muted)" }}>Redirecting to login...</p>
          <div
            className="w-64 mx-auto h-1.5 rounded-full overflow-hidden mt-6"
            style={{ background: "var(--border-base)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2 }}
              className="h-full rounded-full"
              style={{ background: "var(--grad-brand)" }}
            />
          </div>
        </motion.div>
      </div>
    );

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — static dark branding ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(150deg,#071c0e 0%,#0d3320 45%,#0c3347 100%)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,.9) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
            style={{
              background: "radial-gradient(circle,#4ade80,transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.07]"
            style={{
              background: "radial-gradient(circle,#38bdf8,transparent 70%)",
            }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div
            className="p-2 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <AgriSenseLogo size={38} />
          </div>
          <div>
            <div
              className="text-white font-black text-[22px]"
              style={{ fontFamily: "'Fraunces',Georgia,serif" }}
            >
              AgriSense
            </div>
            <div className="text-green-400 text-[10px] font-bold tracking-[0.16em] uppercase">
              Smart Solar Irrigation
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative z-10"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="flex justify-center mb-10"
          >
            <div
              className="w-36 h-36 rounded-3xl flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.13)",
              }}
            >
              <ShieldCheck className="w-20 h-20 text-green-400" />
            </div>
          </motion.div>
          <h2
            className="font-black text-[40px] leading-[1.08] mb-4 text-white"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              letterSpacing: "-0.03em",
            }}
          >
            {step === 1 ? (
              <>
                Enter Your
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg,#fbbf24 0%,#f97316 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Reset Code 🔑
                </span>
              </>
            ) : (
              <>
                Create New
                <br />
                <span
                  style={{
                    background: "var(--grad-brand)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Password 🔐
                </span>
              </>
            )}
          </h2>
          <p className="text-green-200/70 text-[17px] leading-relaxed">
            {step === 1
              ? "Enter the 6-digit code we sent to your email to verify your identity."
              : "Choose a strong password to secure your account."}
          </p>
        </motion.div>
        <div className="relative z-10" />
      </div>

      {/* ── RIGHT PANEL — theme-aware via CSS variables ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative overflow-hidden"
        style={{
          background: "var(--bg-main-gradient)",
          transition: "background 0.3s ease",
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-[0.08]"
            style={{
              background: "radial-gradient(circle,#22c55e,transparent)",
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-[0.06]"
            style={{
              background: "radial-gradient(circle,#0ea5e9,transparent)",
            }}
          />
        </div>
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <AgriSenseLogo size={34} />
          <span
            className="font-black text-lg"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              color: "var(--text-primary)",
            }}
          >
            AgriSense
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="relative z-10 w-full max-w-[420px]"
        >
          <button
            onClick={() => (step === 2 ? setStep(1) : nav("/forgot-password"))}
            className="flex items-center gap-1.5 transition-colors mb-8 text-sm font-semibold group"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="group-hover:text-[var(--text-primary)]">
              {step === 2 ? "Back to Code" : "Back"}
            </span>
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                  style={{
                    background:
                      step >= s ? "var(--grad-brand)" : "var(--bg-card)",
                    border: step < s ? "1px solid var(--border-card)" : "none",
                    color: step >= s ? "white" : "var(--text-muted)",
                  }}
                >
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 2 && (
                  <div
                    className="h-0.5 w-10 rounded-full transition-all"
                    style={{
                      background:
                        step > s ? "var(--brand-500)" : "var(--border-card)",
                    }}
                  />
                )}
              </div>
            ))}
            <span
              className="text-xs font-semibold ml-1"
              style={{ color: "var(--text-muted)" }}
            >
              {step === 1 ? "Enter Code" : "New Password"}
            </span>
          </div>

          {/* Email badge */}
          {email && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-6 text-xs font-semibold"
              style={{
                background: "var(--badge-bg)",
                border: `1px solid var(--border-card)`,
                color: "var(--brand-500)",
              }}
            >
              <span>📧</span>
              <span className="truncate">{email}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-8">
                  <h1
                    className="text-[28px] font-black mb-1.5"
                    style={{
                      letterSpacing: "-0.025em",
                      color: "var(--text-primary)",
                    }}
                  >
                    Enter Reset Code
                  </h1>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    We sent a 6-digit code to your email
                  </p>
                </div>

                <form onSubmit={handleCodeSubmit}>
                  <div className="flex justify-center gap-2.5 mb-2">
                    {codeDigits.map((digit, i) => (
                      <motion.input
                        key={i}
                        ref={(el) => {
                          refs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKey(i, e)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="w-[52px] h-[58px] text-center text-[26px] font-black rounded-2xl outline-none transition-all shadow-sm"
                        style={{
                          background: codeError
                            ? "var(--error-bg)"
                            : digit
                              ? "var(--success-bg)"
                              : "var(--bg-card)",
                          border: `2px solid ${codeError ? "var(--error-color)" : digit ? "var(--success-color)" : "var(--border-card)"}`,
                          color: "var(--text-primary)",
                          boxShadow: codeError
                            ? "0 0 0 4px var(--error-bg)"
                            : digit
                              ? "0 0 0 4px var(--success-bg)"
                              : "var(--shadow-sm)",
                        }}
                      />
                    ))}
                  </div>

                  <div
                    className="flex justify-center mb-4"
                    style={{ minHeight: 22 }}
                  >
                    <AnimatePresence>
                      {codeError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          style={{
                            fontSize: 12,
                            color: "var(--error-color)",
                            fontWeight: 600,
                            textAlign: "center",
                          }}
                        >
                          {codeError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={verifyingCode || filled !== 6}
                    className="w-full py-[14px] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all mb-3 shadow-md"
                    style={{
                      background: "var(--grad-brand)",
                    }}
                  >
                    {verifyingCode ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />{" "}
                        Verifying...
                      </>
                    ) : (
                      <>
                        Continue <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  {/* Resend button */}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-2xl transition-all disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`}
                    />
                    {resendLoading
                      ? "Sending..."
                      : resendCooldown > 0
                        ? `Resend in ${fmt(resendCooldown)}`
                        : "Resend Code"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-8">
                  <h1
                    className="text-[28px] font-black mb-1.5"
                    style={{
                      letterSpacing: "-0.025em",
                      color: "var(--text-primary)",
                    }}
                  >
                    New Password
                  </h1>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Choose a strong password for your account
                  </p>
                </div>

                <form
                  onSubmit={handlePasswordSubmit}
                  noValidate
                  className="space-y-4"
                >
                  <div>
                    <label
                      className="block text-sm font-bold mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{
                          color: passError
                            ? "var(--error-color)"
                            : "var(--text-faint)",
                        }}
                      />
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passError) setPassError("");
                        }}
                        style={{
                          ...inputBase,
                          paddingRight: 48,
                          border: `2px solid ${passError ? "var(--error-color)" : "var(--border-card)"}`,
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.border = `2px solid ${passError ? "var(--error-color)" : "var(--brand-500)"}`)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.border = `2px solid ${passError ? "var(--error-color)" : "var(--border-card)"}`)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        tabIndex={-1}
                        style={{
                          position: "absolute",
                          right: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-faint)",
                          padding: 0,
                        }}
                      >
                        {showNew ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {newPassword && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          marginTop: 10,
                          padding: "12px 14px",
                          background: "var(--bg-card)",
                          borderRadius: 12,
                          border: `1px solid var(--border-card)`,
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "6px 16px",
                        }}
                      >
                        <StrengthRow label="8+ characters" valid={ps.length} />
                        <StrengthRow label="Number" valid={ps.number} />
                        <StrengthRow
                          label="Symbol (!@#...)"
                          valid={ps.symbol}
                        />
                        <StrengthRow label="Uppercase" valid={ps.upper} />
                        <StrengthRow label="Lowercase" valid={ps.lower} />
                      </motion.div>
                    )}
                    {passError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          fontSize: 12,
                          color: "var(--error-color)",
                          marginTop: 6,
                          fontWeight: 500,
                        }}
                      >
                        {passError}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-bold mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{
                          color: confirmError
                            ? "var(--error-color)"
                            : "var(--text-faint)",
                        }}
                      />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (confirmError) setConfirmError("");
                        }}
                        style={{
                          ...inputBase,
                          paddingRight: 48,
                          border: `2px solid ${confirmError ? "var(--error-color)" : "var(--border-card)"}`,
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.border = `2px solid ${confirmError ? "var(--error-color)" : "var(--brand-500)"}`)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.border = `2px solid ${confirmError ? "var(--error-color)" : "var(--border-card)"}`)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        tabIndex={-1}
                        style={{
                          position: "absolute",
                          right: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-faint)",
                          padding: 0,
                        }}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {confirmError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          fontSize: 12,
                          color: "var(--error-color)",
                          marginTop: 6,
                          fontWeight: 500,
                        }}
                      >
                        {confirmError}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-[14px] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md mt-6"
                    style={{
                      background: "var(--grad-brand)",
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />{" "}
                        Resetting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Reset Password
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
