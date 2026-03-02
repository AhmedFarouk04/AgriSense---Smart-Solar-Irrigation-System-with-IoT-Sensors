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

const StrengthRow = ({
  label,
  valid,
  isDark,
}: {
  label: string;
  valid: boolean;
  isDark: boolean;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    {valid ? (
      <CheckCircle2
        style={{ width: 14, height: 14, color: "#22c55e", flexShrink: 0 }}
      />
    ) : (
      <XCircle
        style={{
          width: 14,
          height: 14,
          color: isDark ? "#374151" : "#d1d5db",
          flexShrink: 0,
        }}
      />
    )}
    <span
      style={{
        fontSize: 12,
        color: valid ? "#22c55e" : isDark ? "#6b7280" : "#9ca3af",
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
  const [isDark, setIsDark] = useState(false);

  const filled = codeDigits.filter(Boolean).length;

  useEffect(() => {
    if (step === 1) refs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    const check = () =>
      setIsDark(document.body.classList.contains("theme-dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

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

  const tk = isDark
    ? {
        panelBg: "linear-gradient(135deg,#070d09 0%,#0d1a10 55%,#080f18 100%)",
        blobOp: 0.06,
        heading: "#e8f5e9",
        subtext: "rgba(255,255,255,0.45)",
        backBtn: "rgba(255,255,255,0.40)",
        backBtnHover: "rgba(255,255,255,0.85)",
        label: "rgba(255,255,255,0.70)",
        inputBg: "#0f1f12",
        inputBorder: "#1f3a25",
        inputFocus: "#22c55e",
        inputColor: "#e8f5e9",
        iconColor: "rgba(255,255,255,0.30)",
        mobileName: "#e8f5e9",
        digitBg: "#0d1f10",
        digitBgFilled: "rgba(74,222,128,0.10)",
        digitBgError: "rgba(248,113,113,0.10)",
        digitBorder: "#1a3020",
        digitBorderFilled: "2.5px solid #22c55e",
        digitBorderError: "2.5px solid #f87171",
        digitColor: "#e8f5e9",
        digitShadow: "0 1px 4px rgba(0,0,0,0.3)",
        digitShadowFilled: "0 0 0 4px rgba(74,222,128,0.12)",
        digitShadowError: "0 0 0 4px rgba(248,113,113,0.12)",
        strengthBg: "#0a1a0d",
        strengthBorder: "#1a3020",
        errorColor: "#f87171",
        emailBadgeBg: "rgba(74,222,128,0.08)",
        emailBadgeBorder: "rgba(74,222,128,0.20)",
        emailBadgeText: "#4ade80",
        progressBg: "rgba(255,255,255,0.08)",
        resendBtn: "rgba(255,255,255,0.40)",
        resendBtnHover: "rgba(255,255,255,0.85)",
        resendHoverBg: "rgba(255,255,255,0.05)",
      }
    : {
        panelBg: "linear-gradient(135deg,#f6fdf8 0%,#ffffff 55%,#f7fbff 100%)",
        blobOp: 0.1,
        heading: "#111827",
        subtext: "#6b7280",
        backBtn: "#6b7280",
        backBtnHover: "#111827",
        label: "#374151",
        inputBg: "#ffffff",
        inputBorder: "#e5e7eb",
        inputFocus: "#16a34a",
        inputColor: "#111827",
        iconColor: "#9ca3af",
        mobileName: "#111827",
        digitBg: "white",
        digitBgFilled: "rgba(22,163,74,0.07)",
        digitBgError: "rgba(239,68,68,0.07)",
        digitBorder: "#e5e7eb",
        digitBorderFilled: "2.5px solid #16a34a",
        digitBorderError: "2.5px solid #ef4444",
        digitColor: "#0f172a",
        digitShadow: "0 1px 4px rgba(0,0,0,0.06)",
        digitShadowFilled: "0 0 0 4px rgba(22,163,74,0.10)",
        digitShadowError: "0 0 0 4px rgba(239,68,68,0.10)",
        strengthBg: "#f9fafb",
        strengthBorder: "#e5e7eb",
        errorColor: "#ef4444",
        emailBadgeBg: "rgba(22,163,74,0.07)",
        emailBadgeBorder: "rgba(22,163,74,0.20)",
        emailBadgeText: "#16a34a",
        progressBg: "#f3f4f6",
        resendBtn: "#6b7280",
        resendBtnHover: "#111827",
        resendHoverBg: "#f9fafb",
      };

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px 13px 44px",
    background: tk.inputBg,
    borderRadius: 16,
    outline: "none",
    fontSize: 14,
    fontWeight: 500,
    color: tk.inputColor,
    border: `2px solid ${tk.inputBorder}`,
    transition: "border .2s",
  };

  if (completed)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: tk.panelBg }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="text-center p-14"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 0.7 }}
            className="w-28 h-28 mx-auto mb-6 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
              boxShadow: "0 24px 56px rgba(22,163,74,0.40)",
            }}
          >
            <CheckCircle className="w-14 h-14 text-white" />
          </motion.div>
          <h2
            className="text-4xl font-black mb-2"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              color: tk.heading,
            }}
          >
            Password Reset! 🔐
          </h2>
          <p style={{ color: tk.subtext }}>Redirecting to login...</p>
          <div
            className="w-64 mx-auto h-1.5 rounded-full overflow-hidden mt-6"
            style={{ background: tk.progressBg }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2 }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(135deg,#16a34a,#0ea5e9)" }}
            />
          </div>
        </motion.div>
      </div>
    );

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
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
                    background:
                      "linear-gradient(135deg,#4ade80 0%,#22d3ee 100%)",
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

      {/* RIGHT PANEL */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative overflow-hidden"
        style={{ background: tk.panelBg, transition: "background 0.3s ease" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle,#bbf7d0,transparent)",
              opacity: tk.blobOp,
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle,#bfdbfe,transparent)",
              opacity: tk.blobOp * 0.8,
            }}
          />
        </div>
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <AgriSenseLogo size={34} />
          <span
            className="font-black text-lg"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              color: tk.mobileName,
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
            className="flex items-center gap-1.5 transition-colors mb-8 text-sm font-semibold"
            style={{ color: tk.backBtn }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = tk.backBtnHover)
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = tk.backBtn)}
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 2 ? "Back to Code" : "Back"}
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                  style={{
                    background:
                      step >= s
                        ? "linear-gradient(135deg,#16a34a,#0ea5e9)"
                        : isDark
                          ? "#1a3020"
                          : "#e5e7eb",
                    color: step >= s ? "white" : isDark ? "#6b7280" : "#9ca3af",
                  }}
                >
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 2 && (
                  <div
                    className="h-0.5 w-10 rounded-full transition-all"
                    style={{
                      background:
                        step > s ? "#16a34a" : isDark ? "#1a3020" : "#e5e7eb",
                    }}
                  />
                )}
              </div>
            ))}
            <span
              className="text-xs font-semibold ml-1"
              style={{ color: tk.subtext }}
            >
              {step === 1 ? "Enter Code" : "New Password"}
            </span>
          </div>

          {/* Email badge */}
          {email && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-6 text-xs font-semibold"
              style={{
                background: tk.emailBadgeBg,
                border: `1px solid ${tk.emailBadgeBorder}`,
                color: tk.emailBadgeText,
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
                    style={{ letterSpacing: "-0.025em", color: tk.heading }}
                  >
                    Enter Reset Code
                  </h1>
                  <p className="text-sm" style={{ color: tk.subtext }}>
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
                        className="w-[52px] h-[58px] text-center text-[26px] font-black rounded-2xl outline-none transition-all"
                        style={{
                          border: codeError
                            ? tk.digitBorderError
                            : digit
                              ? tk.digitBorderFilled
                              : `2px solid ${tk.digitBorder}`,
                          background: codeError
                            ? tk.digitBgError
                            : digit
                              ? tk.digitBgFilled
                              : tk.digitBg,
                          boxShadow: codeError
                            ? tk.digitShadowError
                            : digit
                              ? tk.digitShadowFilled
                              : tk.digitShadow,
                          color: tk.digitColor,
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
                            color: tk.errorColor,
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
                    className="w-full py-[14px] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all mb-3"
                    style={{
                      background: "linear-gradient(135deg,#f59e0b,#f97316)",
                      boxShadow: "0 8px 24px rgba(245,158,11,0.28)",
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

                  {/* ✅ Resend button */}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-2xl transition-all disabled:opacity-40"
                    style={{ color: tk.resendBtn }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = tk.resendBtnHover;
                      e.currentTarget.style.background = tk.resendHoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = tk.resendBtn;
                      e.currentTarget.style.background = "transparent";
                    }}
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
                    style={{ letterSpacing: "-0.025em", color: tk.heading }}
                  >
                    New Password
                  </h1>
                  <p className="text-sm" style={{ color: tk.subtext }}>
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
                      style={{ color: tk.label }}
                    >
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{
                          color: passError ? tk.errorColor : tk.iconColor,
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
                          border: `2px solid ${passError ? tk.errorColor : tk.inputBorder}`,
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.border = `2px solid ${passError ? tk.errorColor : tk.inputFocus}`)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.border = `2px solid ${passError ? tk.errorColor : tk.inputBorder}`)
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
                          color: tk.iconColor,
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
                          background: tk.strengthBg,
                          borderRadius: 12,
                          border: `1px solid ${tk.strengthBorder}`,
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "6px 16px",
                        }}
                      >
                        <StrengthRow
                          label="8+ characters"
                          valid={ps.length}
                          isDark={isDark}
                        />
                        <StrengthRow
                          label="Number"
                          valid={ps.number}
                          isDark={isDark}
                        />
                        <StrengthRow
                          label="Symbol (!@#...)"
                          valid={ps.symbol}
                          isDark={isDark}
                        />
                        <StrengthRow
                          label="Uppercase"
                          valid={ps.upper}
                          isDark={isDark}
                        />
                        <StrengthRow
                          label="Lowercase"
                          valid={ps.lower}
                          isDark={isDark}
                        />
                      </motion.div>
                    )}
                    {passError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          fontSize: 12,
                          color: tk.errorColor,
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
                      style={{ color: tk.label }}
                    >
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{
                          color: confirmError ? tk.errorColor : tk.iconColor,
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
                          border: `2px solid ${confirmError ? tk.errorColor : tk.inputBorder}`,
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.border = `2px solid ${confirmError ? tk.errorColor : tk.inputFocus}`)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.border = `2px solid ${confirmError ? tk.errorColor : tk.inputBorder}`)
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
                          color: tk.iconColor,
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
                          color: tk.errorColor,
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
                    className="w-full py-[14px] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    style={{
                      background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
                      boxShadow: "0 8px 24px rgba(22,163,74,0.28)",
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
