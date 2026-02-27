import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, RefreshCw, Inbox } from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

export default function Verify() {
  const verifyEmail = useMutation(api.users.verifyEmail);
  const resendCode = useMutation(api.users.sendVerificationCode);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
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
      toast.success("Email verified! Welcome to AgriSense 🌱");
      setTimeout(() => nav("/dashboard"), 2000);
    } catch {
      toast.error("Invalid or expired code — try again");
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
      refs.current[0]?.focus();
      toast.success("New code sent! Check your inbox 📧");
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (done)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg,#f0fdf4,#ffffff,#eff6ff)",
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
              background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
              boxShadow: "0 24px 56px rgba(22,163,74,0.45)",
            }}
          >
            <CheckCircle className="w-14 h-14 text-white" />
          </motion.div>
          <h2
            className="text-4xl font-black text-gray-900 mb-2"
            style={{ fontFamily: "'Fraunces',Georgia,serif" }}
          >
            Verified! 🎉
          </h2>
          <p className="text-gray-500 mb-6">Redirecting to your dashboard...</p>
          <div className="w-64 mx-auto h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
      {/* LEFT */}
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

      {/* RIGHT */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative"
        style={{
          background:
            "linear-gradient(135deg,#f0fdf4 0%,#ffffff 50%,#eff6ff 100%)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{
              background: "radial-gradient(circle,#bbf7d0,transparent)",
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle,#bfdbfe,transparent)",
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
            onClick={() => nav("/register")}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors mb-8 text-sm font-semibold"
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
                border: "2px solid rgba(22,163,74,0.2)",
                boxShadow: "0 12px 32px rgba(22,163,74,0.12)",
              }}
            >
              <Inbox className="w-10 h-10 text-green-600" />
            </motion.div>
          </div>

          <div className="text-center mb-8">
            <h1
              className="text-[28px] font-black text-gray-900 mb-1.5"
              style={{ letterSpacing: "-0.025em" }}
            >
              Verify your email
            </h1>
            <p className="text-gray-400 text-sm">We sent a 6-digit code to</p>
            <p className="text-green-600 font-black text-sm mt-0.5 truncate">
              {email}
            </p>
          </div>

          <form onSubmit={handleVerify}>
            {/* OTP boxes */}
            <div className="flex justify-center gap-2.5 mb-5">
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
                    border: digit ? "2.5px solid #16a34a" : "2px solid #e5e7eb",
                    background: digit ? "rgba(22,163,74,0.07)" : "white",
                    boxShadow: digit
                      ? "0 0 0 4px rgba(22,163,74,0.1)"
                      : "0 1px 4px rgba(0,0,0,0.06)",
                    color: "#0f172a",
                  }}
                />
              ))}
            </div>

            {/* Timer + progress */}
            <div className="flex items-center justify-between text-xs font-semibold mb-2 text-gray-400">
              <span>{filled}/6 entered</span>
              <span className={timeLeft < 60 ? "text-red-500 font-black" : ""}>
                {timeLeft > 0
                  ? `⏱ Expires in ${fmt(timeLeft)}`
                  : "⚠️ Code expired"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
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
              disabled={resendLoading || timeLeft > 0}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-2xl transition-all disabled:opacity-40"
            >
              <RefreshCw
                className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`}
              />
              {resendLoading
                ? "Sending..."
                : timeLeft > 0
                  ? `Resend in ${fmt(timeLeft)}`
                  : "Resend Code"}
            </button>
          </form>

          <div
            className="mt-7 p-4 rounded-2xl flex items-start gap-3"
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.14)",
            }}
          >
            <span className="text-base flex-shrink-0 mt-0.5">💡</span>
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Didn't receive the code?</strong> Check your spam/junk
              folder. The code expires in 5 minutes — you can request a new one
              after expiry.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Wrong email?{" "}
            <button
              onClick={() => nav("/register")}
              className="text-green-600 font-bold hover:underline"
            >
              Use a different email
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
