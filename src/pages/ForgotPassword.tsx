import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  CheckCircle,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const requestReset = useMutation(api.authHelpers.requestPasswordReset);

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

  const validateEmail = (val: string): string => {
    if (!val.trim()) return "Email address is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()))
      return "Please enter a valid email address";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setLoading(true);
    try {
      const result = await requestReset({ email: email.trim().toLowerCase() });
      // ✅ بنقرأ الـ userExists من الـ response مباشرة
      if (result?.userExists === false) {
        setEmailError("No account found with this email address");
      } else {
        // ✅ حفظ الإيميل وانتقال مباشر — بدون success screen
        sessionStorage.setItem("resetEmail", email.trim().toLowerCase());
        nav("/reset-password");
      }
    } catch {
      toast.error("Failed to send reset code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const tk = isDark
    ? {
        panelBg: "linear-gradient(135deg,#070d09 0%,#0d1a10 55%,#080f18 100%)",
        blobOp: 0.06,
        heading: "#e8f5e9",
        subtext: "rgba(255,255,255,0.45)",
        backBtn: "rgba(255,255,255,0.40)",
        backBtnHover: "rgba(255,255,255,0.85)",
        iconBg:
          "linear-gradient(135deg,rgba(245,158,11,0.18),rgba(249,115,22,0.18))",
        iconBorder: "2px solid rgba(245,158,11,0.30)",
        label: "rgba(255,255,255,0.70)",
        inputBg: "#0f1f12",
        inputBorder: "#1f3a25",
        inputFocus: "#f59e0b",
        inputColor: "#e8f5e9",
        iconColor: "rgba(255,255,255,0.30)",
        mobileName: "#e8f5e9",
        successBg: "rgba(74,222,128,0.07)",
        successBorder: "rgba(74,222,128,0.20)",
        successHead: "#e8f5e9",
        successSub: "#86efac",
        successEmail: "#4ade80",
        altBtn: "rgba(255,255,255,0.35)",
        altBtnHover: "rgba(255,255,255,0.70)",
        errorColor: "#f87171",
      }
    : {
        panelBg: "linear-gradient(135deg,#fffbeb 0%,#ffffff 50%,#eff6ff 100%)",
        blobOp: 0.3,
        heading: "#111827",
        subtext: "#6b7280",
        backBtn: "#6b7280",
        backBtnHover: "#111827",
        iconBg:
          "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(249,115,22,0.15))",
        iconBorder: "2px solid rgba(245,158,11,0.25)",
        label: "#374151",
        inputBg: "#ffffff",
        inputBorder: "#e5e7eb",
        inputFocus: "#f59e0b",
        inputColor: "#111827",
        iconColor: "#9ca3af",
        mobileName: "#111827",
        successBg: "rgba(22,163,74,0.07)",
        successBorder: "rgba(22,163,74,0.20)",
        successHead: "#111827",
        successSub: "#166534",
        successEmail: "#16a34a",
        altBtn: "#6b7280",
        altBtnHover: "#374151",
        errorColor: "#ef4444",
      };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — dark always ── */}
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
          className="relative z-10 text-center"
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
              <KeyRound className="w-20 h-20 text-yellow-400" />
            </div>
          </motion.div>
          <h2
            className="font-black text-[40px] leading-[1.08] mb-4 text-white text-left"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              letterSpacing: "-0.03em",
            }}
          >
            Forgot Your
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#fbbf24 0%,#f97316 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Password? 🔑
            </span>
          </h2>
          <p className="text-green-200/70 text-[17px] leading-relaxed text-left">
            No worries! Enter your email address and we'll send you a 6-digit
            reset code instantly.
          </p>
        </motion.div>

        <div className="relative z-10" />
      </div>

      {/* ── RIGHT PANEL — theme-aware ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative"
        style={{ background: tk.panelBg, transition: "background 0.3s ease" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle,#fef3c7,transparent)",
              opacity: tk.blobOp,
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
            onClick={() => nav("/login")}
            className="flex items-center gap-1.5 transition-colors mb-8 text-sm font-semibold"
            style={{ color: tk.backBtn }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = tk.backBtnHover)
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = tk.backBtn)}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>

          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: tk.iconBg, border: tk.iconBorder }}
            >
              <KeyRound className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1
              className="text-[28px] font-black mb-2"
              style={{ letterSpacing: "-0.025em", color: tk.heading }}
            >
              Forgot password?
            </h1>
            <p className="text-sm" style={{ color: tk.subtext }}>
              Enter your email and we'll send a reset code
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  className="block text-sm font-bold mb-1.5"
                  style={{ color: tk.label }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: emailError ? tk.errorColor : tk.iconColor }}
                  />
                  <input
                    type="text"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={() => {
                      const err = validateEmail(email);
                      if (err) setEmailError(err);
                    }}
                    className="w-full pl-11 pr-4 py-[14px] rounded-2xl outline-none transition-all text-sm font-medium"
                    style={{
                      background: tk.inputBg,
                      border: `2px solid ${emailError ? tk.errorColor : tk.inputBorder}`,
                      color: tk.inputColor,
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.border = `2px solid ${emailError ? tk.errorColor : tk.inputFocus}`)
                    }
                  />
                </div>
                {emailError && (
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
                    {emailError}
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
                  background: "linear-gradient(135deg,#f59e0b,#f97316)",
                  boxShadow: "0 8px 24px rgba(245,158,11,0.30)",
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />{" "}
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => nav("/reset-password")}
                className="w-full py-3 text-sm font-semibold transition-colors"
                style={{ color: tk.altBtn }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = tk.altBtnHover)
                }
                onMouseLeave={(e) => (e.currentTarget.style.color = tk.altBtn)}
              >
                Already have a code? Enter it here →
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 rounded-2xl"
              style={{
                background: tk.successBg,
                border: `2px solid ${tk.successBorder}`,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
                className="flex justify-center mb-4"
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              <h3
                className="font-black text-xl mb-2"
                style={{ color: tk.successHead }}
              >
                Code sent! 📧
              </h3>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: tk.successSub }}
              >
                Reset code sent to
              </p>
              <p
                className="font-black text-sm mb-6 truncate"
                style={{ color: tk.successEmail }}
              >
                {email}
              </p>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => nav("/reset-password")}
                className="w-full py-[14px] text-white rounded-2xl font-black text-sm"
                style={{
                  background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
                }}
              >
                Enter Reset Code →
              </motion.button>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 text-sm font-semibold transition-colors block w-full"
                style={{ color: tk.altBtn }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = tk.altBtnHover)
                }
                onMouseLeave={(e) => (e.currentTarget.style.color = tk.altBtn)}
              >
                Try a different email
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
