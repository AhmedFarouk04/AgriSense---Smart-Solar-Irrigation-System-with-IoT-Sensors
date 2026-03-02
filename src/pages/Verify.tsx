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
  const [isDark, setIsDark] = useState(false);
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

  const tk = isDark
    ? {
        doneBg: "linear-gradient(135deg,#070d09 0%,#0d1a10 55%,#080f18 100%)",
        doneHead: "#e8f5e9",
        doneSub: "rgba(255,255,255,0.45)",
        panelBg: "linear-gradient(135deg,#070d09 0%,#0d1a10 50%,#080f18 100%)",
        blob1Op: 0.06,
        blob2Op: 0.05,
        heading: "#e8f5e9",
        subtext: "rgba(255,255,255,0.45)",
        emailColor: "#4ade80",
        backBtn: "rgba(255,255,255,0.40)",
        backBtnHover: "rgba(255,255,255,0.85)",
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
        timerNormal: "rgba(255,255,255,0.35)",
        progressBg: "rgba(255,255,255,0.08)",
        resendBtn: "rgba(255,255,255,0.40)",
        resendBtnHover: "rgba(255,255,255,0.85)",
        resendHoverBg: "rgba(255,255,255,0.05)",
        footerText: "rgba(255,255,255,0.30)",
        footerLink: "#4ade80",
        iconBg:
          "linear-gradient(135deg,rgba(22,163,74,0.15),rgba(14,165,233,0.15))",
        iconBorder: "2px solid rgba(22,163,74,0.25)",
        iconShadow: "0 12px 32px rgba(22,163,74,0.10)",
        errorColor: "#f87171",
      }
    : {
        doneBg: "linear-gradient(135deg,#f0fdf4,#ffffff,#eff6ff)",
        doneHead: "#111827",
        doneSub: "#6b7280",
        panelBg: "linear-gradient(135deg,#f0fdf4 0%,#ffffff 50%,#eff6ff 100%)",
        blob1Op: 0.3,
        blob2Op: 0.2,
        heading: "#111827",
        subtext: "#9ca3af",
        emailColor: "#16a34a",
        backBtn: "#6b7280",
        backBtnHover: "#111827",
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
        timerNormal: "#9ca3af",
        progressBg: "#f3f4f6",
        resendBtn: "#6b7280",
        resendBtnHover: "#111827",
        resendHoverBg: "#f9fafb",
        footerText: "#9ca3af",
        footerLink: "#16a34a",
        iconBg:
          "linear-gradient(135deg,rgba(22,163,74,0.12),rgba(14,165,233,0.12))",
        iconBorder: "2px solid rgba(22,163,74,0.2)",
        iconShadow: "0 12px 32px rgba(22,163,74,0.12)",
        errorColor: "#ef4444",
      };

  if (done)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: tk.doneBg }}
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
              boxShadow: "0 24px 56px rgba(22,163,74,0.45)",
            }}
          >
            <CheckCircle className="w-14 h-14 text-white" />
          </motion.div>
          <h2
            className="text-4xl font-black mb-2"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              color: tk.doneHead,
            }}
          >
            Verified! 🎉
          </h2>
          <p className="mb-6" style={{ color: tk.doneSub }}>
            Redirecting to your dashboard...
          </p>
          <div
            className="w-64 mx-auto h-1.5 rounded-full overflow-hidden"
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

      {/* RIGHT PANEL */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative"
        style={{ background: tk.panelBg, transition: "background 0.3s ease" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle,#bbf7d0,transparent)",
              opacity: tk.blob1Op,
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle,#bfdbfe,transparent)",
              opacity: tk.blob2Op,
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
            onClick={() => nav("/register")}
            className="flex items-center gap-1.5 transition-colors mb-8 text-sm font-semibold"
            style={{ color: tk.backBtn }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = tk.backBtnHover)
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = tk.backBtn)}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Register
          </button>

          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3.5, repeat: Infinity }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: tk.iconBg,
                border: tk.iconBorder,
                boxShadow: tk.iconShadow,
              }}
            >
              <Inbox className="w-10 h-10 text-green-500" />
            </motion.div>
          </div>

          <div className="text-center mb-8">
            <h1
              className="text-[28px] font-black mb-1.5"
              style={{ letterSpacing: "-0.025em", color: tk.heading }}
            >
              Verify your email
            </h1>
            <p className="text-sm" style={{ color: tk.subtext }}>
              We sent a 6-digit code to
            </p>
            <p
              className="font-black text-sm mt-0.5 truncate"
              style={{ color: tk.emailColor }}
            >
              {email}
            </p>
          </div>

          <form onSubmit={handleVerify}>
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

            <div className="flex justify-center mb-3" style={{ minHeight: 22 }}>
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

            <div
              className="flex items-center justify-between text-xs font-semibold mb-2"
              style={{ color: tk.timerNormal }}
            >
              <span>{filled}/6 entered</span>
              <span className={timeLeft < 60 ? "text-red-500 font-black" : ""}>
                {timeLeft > 0
                  ? `⏱ Expires in ${fmt(timeLeft)}`
                  : "⚠️ Code expired"}
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full mb-6 overflow-hidden"
              style={{ background: tk.progressBg }}
            >
              <motion.div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
                  width: `${(filled / 6) * 100}%`,
                }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading || filled !== 6}
              className="w-full py-[14px] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all mb-3"
              style={{
                background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
                boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />{" "}
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Verify Email
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
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
              {resendLoading ? "Sending..." : "Resend Code"}
            </button>
          </form>

          <p
            className="text-center text-xs mt-5"
            style={{ color: tk.footerText }}
          >
            Wrong email?{" "}
            <button
              onClick={handleDifferentEmail}
              className="font-bold hover:underline"
              style={{ color: tk.footerLink }}
            >
              Use a different email
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
