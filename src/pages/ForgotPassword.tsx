import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
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
  const requestReset = useMutation(api.authHelpers.requestPasswordReset);

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
      if (result?.userExists === false) {
        setEmailError("No account found with this email address");
      } else {
        sessionStorage.setItem("resetEmail", email.trim().toLowerCase());
        setSubmitted(true); // ✅ نقلنا اليوزر لحالة النجاح
      }
    } catch {
      toast.error("Failed to send reset code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — static dark, intentionally not theme-aware ── */}
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
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-[0.08]"
            style={{
              background: "radial-gradient(circle,#fef3c7,transparent)",
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
            onClick={() => nav("/login")}
            className="flex items-center gap-1.5 transition-colors mb-8 text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(249,115,22,0.15))",
                border: "2px solid rgba(245,158,11,0.25)",
              }}
            >
              <KeyRound className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1
              className="text-[28px] font-black mb-2"
              style={{
                letterSpacing: "-0.025em",
                color: "var(--text-primary)",
              }}
            >
              Forgot password?
            </h1>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Enter your email and we'll send a reset code
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  className="block text-sm font-bold mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{
                      color: emailError ? "#f87171" : "var(--text-faint)",
                    }}
                  />
                  {/* ✅ دمجنا onBlur هنا عشان نعالج الـ Error */}
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = emailError
                        ? "#f87171"
                        : "var(--brand-500)")
                    }
                    onBlur={(e) => {
                      const err = validateEmail(email);
                      if (err) setEmailError(err);
                      e.currentTarget.style.borderColor = err
                        ? "#f87171"
                        : "var(--border-card)";
                    }}
                    className="w-full pl-11 pr-4 py-[14px] rounded-2xl outline-none transition-all text-sm font-medium"
                    style={{
                      background: "var(--glass-bg)",
                      border: `2px solid ${emailError ? "#f87171" : "var(--border-card)"}`,
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: 12,
                      color: "#f87171",
                      marginTop: 6,
                      fontWeight: 500,
                    }}
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>

              {/* Submit */}
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
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Already have a code */}
              <button
                type="button"
                onClick={() => nav("/reset-password")}
                className="w-full py-3 text-sm font-semibold transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                Already have a code? Enter it here →
              </button>
            </form>
          ) : (
            /* Success state */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 rounded-2xl"
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "2px solid rgba(34, 197, 94, 0.2)",
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
                style={{ color: "var(--text-primary)" }}
              >
                Code sent! 📧
              </h3>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Reset code sent to
              </p>
              <p
                className="font-black text-sm mb-6 truncate"
                style={{ color: "#22c55e" }}
              >
                {email}
              </p>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => nav("/reset-password")}
                className="w-full py-[14px] text-white rounded-2xl font-black text-sm"
                style={{ background: "var(--grad-brand)" }}
              >
                Enter Reset Code →
              </motion.button>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 text-sm font-semibold transition-colors block w-full"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                Try a different email
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
