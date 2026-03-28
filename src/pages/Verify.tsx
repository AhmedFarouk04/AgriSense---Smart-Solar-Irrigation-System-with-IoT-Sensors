import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, RefreshCw, Inbox } from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

export default function Verify() {
  const verifyEmail = useMutation(api.auth.verifyEmailCode);
  const resendCode = useMutation(api.auth.resendVerificationCode);
  const { signOut } = useAuthActions();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [done, setDone] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const email = sessionStorage.getItem("verificationEmail") || "your email";
  const filled = code.filter(Boolean).length;

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const handleChange = (i: number, val: string) => {
    if (codeError) setCodeError("");
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6);
      const nc = [...code];
      digits.split("").forEach((d, j) => {
        if (j < 6) nc[j] = d;
      });
      setCode(nc);
      refs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    if (!/^\d*$/.test(val)) return;
    const nc = [...code];
    nc[i] = val;
    setCode(nc);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0)
      refs.current[i - 1]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (filled !== 6) return;
    setLoading(true);
    try {
      await verifyEmail({ code: code.join("") });
      setDone(true);
      sessionStorage.removeItem("verificationEmail");
      setTimeout(() => nav("/dashboard"), 2000);
    } catch (error: any) {
      const msg = error?.message ?? "";
      if (msg.includes("expired")) {
        setCodeError("Code expired — request a new one below");
      } else {
        setCodeError("Invalid code — please try again");
      }
      setCode(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await resendCode();
      setTimeLeft(300);
      setCode(["", "", "", "", "", ""]);
      setCodeError("");
      refs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleDifferentEmail = async () => {
    sessionStorage.removeItem("verificationEmail");
    await signOut();
    nav("/register");
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Digit box styles — computed per-cell, pure CSS variables ──
  const digitStyle = (digit: string): React.CSSProperties => ({
    width: 52,
    height: 58,
    textAlign: "center",
    fontSize: 26,
    fontWeight: 900,
    borderRadius: 16,
    outline: "none",
    transition: "all 0.15s",
    color: "var(--text-primary)",
    background: codeError
      ? "var(--error-bg)"
      : digit
        ? "var(--success-bg)"
        : "var(--glass-bg)",
    border: codeError
      ? "2.5px solid var(--error-color)"
      : digit
        ? "2.5px solid var(--success-color)"
        : "2px solid var(--border-card)",
    boxShadow: codeError
      ? "0 0 0 4px var(--error-bg)"
      : digit
        ? "0 0 0 4px var(--success-bg)"
        : "var(--shadow-sm)",
  });

  // ── Done screen ──
  if (done)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "var(--bg-main-gradient)",
          transition: "background 0.3s ease",
        }}
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
              background: "var(--grad-brand)",
              boxShadow: "0 24px 56px rgba(22,163,74,0.45)",
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
            Verified! 🎉
          </h2>
          <p className="mb-6" style={{ color: "var(--text-muted)" }}>
            Redirecting to your dashboard...
          </p>
          <div
            className="w-64 mx-auto h-1.5 rounded-full overflow-hidden"
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
      {/* ── LEFT PANEL — static dark, intentionally not theme-aware ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-center p-14 relative overflow-hidden"
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
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 flex items-center gap-3 mb-16"
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
          <div className="flex justify-center mb-10">
            <div className="relative">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-36 h-36 rounded-3xl flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <Inbox className="w-20 h-20 text-green-400" />
              </motion.div>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -24, 0], opacity: [0, 1, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.7,
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: ["#4ade80", "#38bdf8", "#f59e0b"][i],
                    top: i === 0 ? -6 : i === 1 ? 4 : -2,
                    right: i === 0 ? -6 : i === 1 ? -18 : 4,
                  }}
                />
              ))}
            </div>
          </div>

          <h2
            className="font-black text-[40px] leading-[1.08] mb-4 text-white"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              letterSpacing: "-0.03em",
            }}
          >
            Check Your
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#4ade80 0%,#22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Inbox 📧
            </span>
          </h2>
          <p className="text-green-200/70 text-[17px] leading-relaxed mb-8">
            We sent a 6-digit code to your email. Enter it on the right to
            activate your account.
          </p>
          <div className="space-y-3.5">
            {[
              ["1", "Check your inbox (and spam folder)"],
              ["2", "Enter the 6-digit verification code"],
              ["3", "Code expires in 5 minutes"],
            ].map(([n, t]) => (
              <div key={n} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-green-900 flex-shrink-0"
                  style={{
                    background: "rgba(74,222,128,0.25)",
                    border: "1px solid rgba(74,222,128,0.3)",
                  }}
                >
                  {n}
                </div>
                <span className="text-green-100/75 text-[14px]">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL — theme-aware via CSS variables ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative"
        style={{
          background: "var(--bg-main-gradient)",
          transition: "background 0.3s ease",
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle,#bbf7d0,transparent)",
              opacity: 0.08,
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle,#bfdbfe,transparent)",
              opacity: 0.06,
            }}
          />
        </div>

        {/* Mobile logo */}
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
          {/* Back button */}
          <button
            onClick={() => nav("/register")}
            className="flex items-center gap-1.5 transition-colors mb-8 text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            <ArrowLeft className="w-4 h-4" /> Back to Register
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3.5, repeat: Infinity }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg,rgba(22,163,74,0.12),rgba(14,165,233,0.12))",
                border: "2px solid var(--success-border)",
                boxShadow: "0 12px 32px rgba(22,163,74,0.10)",
              }}
            >
              <Inbox className="w-10 h-10 text-green-500" />
            </motion.div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1
              className="text-[28px] font-black mb-1.5"
              style={{
                letterSpacing: "-0.025em",
                color: "var(--text-primary)",
              }}
            >
              Verify your email
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              We sent a 6-digit code to
            </p>
            <p
              className="font-black text-sm mt-0.5 truncate"
              style={{ color: "var(--success-color)" }}
            >
              {email}
            </p>
          </div>

          <form onSubmit={handleVerify}>
            {/* OTP digit inputs */}
            <div className="flex justify-center gap-2.5 mb-2">
              {code.map((digit, i) => (
                <motion.input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKey(i, e)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={digitStyle(digit)}
                />
              ))}
            </div>

            {/* Error message */}
            <div className="flex justify-center mb-3" style={{ minHeight: 22 }}>
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

            {/* Timer + fill counter */}
            <div
              className="flex items-center justify-between text-xs font-semibold mb-2"
              style={{ color: "var(--text-faint)" }}
            >
              <span>{filled}/6 entered</span>
              <span className={timeLeft < 60 ? "text-red-500 font-black" : ""}>
                {timeLeft > 0
                  ? `⏱ Expires in ${fmt(timeLeft)}`
                  : "⚠️ Code expired"}
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="w-full h-1.5 rounded-full mb-6 overflow-hidden"
              style={{ background: "var(--border-base)" }}
            >
              <motion.div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  background: "var(--grad-brand)",
                  width: `${(filled / 6) * 100}%`,
                }}
              />
            </div>

            {/* Verify button */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading || filled !== 6}
              className="w-full py-[14px] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all mb-3"
              style={{
                background: "var(--grad-brand)",
                boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.5)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />{" "}
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Verify Email
                </>
              )}
            </motion.button>

            {/* Resend button */}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-2xl transition-all disabled:opacity-40"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "var(--glass-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <RefreshCw
                className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`}
              />
              {resendLoading ? "Sending..." : "Resend Code"}
            </button>
          </form>

          {/* Footer */}
          <p
            className="text-center text-xs mt-5"
            style={{ color: "var(--text-faint)" }}
          >
            Wrong email?{" "}
            <button
              onClick={handleDifferentEmail}
              className="font-bold hover:underline"
              style={{ color: "var(--brand-500)" }}
            >
              Use a different email
            </button>
          </p>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
