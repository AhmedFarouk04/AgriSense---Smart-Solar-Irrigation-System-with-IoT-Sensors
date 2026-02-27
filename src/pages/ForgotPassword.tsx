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
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const requestReset = useMutation(api.authHelpers.requestPasswordReset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestReset({ email });
      setSubmitted(true);
      toast.success("Reset code sent to your email");
    } catch {
      toast.error("Failed to send reset code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
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

      {/* RIGHT */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative"
        style={{
          background:
            "linear-gradient(135deg,#fffbeb 0%,#ffffff 50%,#eff6ff 100%)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{
              background: "radial-gradient(circle,#fef3c7,transparent)",
            }}
          />
        </div>

        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <AgriSenseLogo size={34} />
          <span
            className="font-black text-gray-900 text-lg"
            style={{ fontFamily: "'Fraunces',Georgia,serif" }}
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
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors mb-8 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>

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

          <div className="text-center mb-8">
            <h1
              className="text-[28px] font-black text-gray-900 mb-2"
              style={{ letterSpacing: "-0.025em" }}
            >
              Forgot password?
            </h1>
            <p className="text-gray-500 text-sm">
              Enter your email and we'll send a reset code
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="farmer@gmail.com"
                    className="w-full pl-11 pr-4 py-[14px] bg-white rounded-2xl outline-none transition-all text-sm font-medium placeholder:text-gray-400 placeholder:font-normal"
                    style={{ border: "2px solid #e5e7eb" }}
                    onFocus={(e) =>
                      (e.currentTarget.style.border = "2px solid #f59e0b")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.border = "2px solid #e5e7eb")
                    }
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="w-full py-[14px] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{
                  background: "linear-gradient(135deg,#f59e0b,#f97316)",
                  boxShadow: "0 8px 24px rgba(245,158,11,0.38)",
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
                className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
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
                background: "rgba(22,163,74,0.07)",
                border: "2px solid rgba(22,163,74,0.2)",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
                className="flex justify-center mb-4"
              >
                <CheckCircle className="w-16 h-16 text-green-600" />
              </motion.div>
              <h3 className="font-black text-xl text-gray-900 mb-2">
                Code sent! 📧
              </h3>
              <p className="text-green-800 text-sm font-medium mb-1">
                Reset code sent to
              </p>
              <p className="text-green-600 font-black text-sm mb-6 truncate">
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
                className="mt-3 text-sm text-gray-500 hover:text-gray-700 font-semibold"
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
