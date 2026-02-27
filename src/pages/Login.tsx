import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

export default function Login() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      toast.success("Welcome back! 🌱");
    } catch {
      toast.error("Invalid email or password");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGLoading(true);
    try {
      await signIn("google", {
        redirectTo: window.location.origin, // سيقوم تلقائياً بالعودة لـ localhost:5173
      });
    } catch (e) {
      console.error(e);
      setGLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex">
      {/* ===== LEFT PANEL ===== */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(150deg,#071c0e 0%,#0d3320 45%,#0c3347 100%)",
        }}
      >
        {/* bg decoration */}
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
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.03]"
            style={{
              background: "radial-gradient(circle,white,transparent 70%)",
            }}
          />
        </div>

        {/* Logo */}
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
              style={{
                fontFamily: "'Fraunces',Georgia,serif",
                letterSpacing: "-0.02em",
              }}
            >
              AgriSense
            </div>
            <div className="text-green-400 text-[10px] font-bold tracking-[0.16em] uppercase">
              Smart Solar Irrigation
            </div>
          </div>
        </motion.div>

        {/* Center hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="relative z-10"
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="flex justify-center mb-10"
          >
            <div
              className="w-[148px] h-[148px] rounded-[32px] flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.13)",
                boxShadow:
                  "0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <AgriSenseLogo size={96} />
            </div>
          </motion.div>

          <h2
            className="font-black text-[40px] leading-[1.08] mb-4 text-white"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              letterSpacing: "-0.03em",
            }}
          >
            Farm Smarter,
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#4ade80 0%,#22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Not Harder
            </span>
          </h2>
          <p className="text-green-200/70 text-[17px] leading-relaxed mb-10">
            AI-powered solar irrigation that monitors your soil 24/7 and waters
            automatically — saving water and maximizing yields.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ["10K+", "Farmers"],
              ["30%", "Water Saved"],
              ["24/7", "Monitoring"],
            ].map(([n, l], i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.1 }}
                className="text-center py-4 px-2 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <div
                  className="text-white font-black text-[22px]"
                  style={{ fontFamily: "'Fraunces',Georgia,serif" }}
                >
                  {n}
                </div>
                <div className="text-green-300/70 text-[11px] font-semibold mt-0.5">
                  {l}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 p-5 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-sm">
                ★
              </span>
            ))}
          </div>
          <p className="text-green-100/80 text-sm leading-relaxed italic">
            "AgriSense cut my water usage by 35% in the first season. The
            real-time alerts saved my entire tomato crop last summer."
          </p>
          <div className="flex items-center gap-2.5 mt-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black"
              style={{ background: "linear-gradient(135deg,#16a34a,#0ea5e9)" }}
            >
              AK
            </div>
            <div>
              <div className="text-white text-[13px] font-bold">
                Ahmed Al-Khalili
              </div>
              <div className="text-green-400 text-[11px]">
                Farm Owner · Riyadh, KSA
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg,#f0fdf4 0%,#ffffff 50%,#eff6ff 100%)",
        }}
      >
        {/* bg blobs */}
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

        {/* Mobile logo */}
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
          <div className="mb-8">
            <h1
              className="text-[32px] font-black text-gray-900 mb-2"
              style={{ letterSpacing: "-0.025em" }}
            >
              Welcome back 👋
            </h1>
            <p className="text-gray-500 text-[15px]">
              Sign in to manage your smart farm
            </p>
          </div>

          {/* Google */}
          <motion.button
            whileHover={{
              scale: 1.015,
              boxShadow: "0 8px 28px rgba(0,0,0,0.1)",
            }}
            whileTap={{ scale: 0.985 }}
            onClick={handleGoogle}
            disabled={gLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-[14px] px-4 bg-white rounded-2xl font-semibold text-gray-700 transition-all disabled:opacity-50 mb-5"
            style={{
              border: "2px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {gLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />{" "}
                Redirecting to Google...
              </>
            ) : (
              <>
                <GoogleIcon /> Continue with Google
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs font-semibold">
              OR SIGN IN WITH EMAIL
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
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
                    (e.currentTarget.style.border = "2px solid #16a34a")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = "2px solid #e5e7eb")
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-[14px] bg-white rounded-2xl outline-none transition-all text-sm font-medium"
                  style={{ border: "2px solid #e5e7eb" }}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "2px solid #16a34a")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = "2px solid #e5e7eb")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 accent-green-600"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => nav("/forgot-password")}
                className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading || gLoading}
              className="w-full py-[14px] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{
                background: "linear-gradient(135deg,#16a34a 0%,#0ea5e9 100%)",
                boxShadow: "0 8px 24px rgba(22,163,74,0.38)",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />{" "}
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <button
              onClick={() => nav("/register")}
              className="font-black text-green-600 hover:text-green-700 transition-colors"
            >
              Create account →
            </button>
          </p>

          {/* Trust */}
          <div
            className="mt-8 p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: "rgba(22,163,74,0.06)",
              border: "1px solid rgba(22,163,74,0.14)",
            }}
          >
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-800">
              <strong>256-bit SSL encrypted</strong> — your farm data is fully
              protected and never shared with third parties.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
