import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
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
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isDark, setIsDark] = useState(false);

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

  const validateForm = (): boolean => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await signIn("password", {
        email: email.trim(),
        password,
        flow: "signIn",
      });
      toast.success("Welcome back! 🌱", {
        description: "Redirecting to dashboard...",
      });

      setTimeout(() => nav("/dashboard"), 1500);
    } catch (error: any) {
      console.error("Login error:", error);

      setErrors({
        email: " ",
        password: "Invalid email or password",
      });

      setLoading(false);
    }
  };
  const handleGoogle = async () => {
    setGLoading(true);
    try {
      await signIn("google", { redirectTo: window.location.origin });
    } catch (error: any) {
      console.error(error);
      toast.error("Google sign-in failed", {
        description: error?.message || "Please try again later.",
      });
      setGLoading(false);
    }
  };

  const tk = isDark
    ? {
        panelBg: "linear-gradient(135deg,#070d09 0%,#0d1a10 55%,#080f18 100%)",
        blob1Op: 0.06,
        blob2Op: 0.05,
        heading: "#e8f5e9",
        subtext: "rgba(255,255,255,0.45)",
        label: "rgba(255,255,255,0.70)",
        inputBg: "#0f1f12",
        inputBorder: "#1f3a25",
        inputFocus: "#22c55e",
        inputColor: "#e8f5e9",
        iconColor: "rgba(255,255,255,0.30)",
        dividerLine: "rgba(255,255,255,0.08)",
        dividerText: "rgba(255,255,255,0.28)",
        googleBg: "#0f1f12",
        googleBorder: "#1f3a25",
        googleColor: "#e8f5e9",
        checkText: "rgba(255,255,255,0.55)",
        footerText: "rgba(255,255,255,0.38)",
        mobileName: "#e8f5e9",
      }
    : {
        panelBg: "linear-gradient(135deg,#f6fdf8 0%,#ffffff 55%,#f7fbff 100%)",
        blob1Op: 0.1,
        blob2Op: 0.08,
        heading: "#111827",
        subtext: "#6b7280",
        label: "#374151",
        inputBg: "#ffffff",
        inputBorder: "#e5e7eb",
        inputFocus: "#16a34a",
        inputColor: "#111827",
        iconColor: "#9ca3af",
        dividerLine: "#e5e7eb",
        dividerText: "#9ca3af",
        googleBg: "#ffffff",
        googleBorder: "#e5e7eb",
        googleColor: "#374151",
        checkText: "#4b5563",
        footerText: "#6b7280",
        mobileName: "#111827",
      };

  const borderColor = (field: "email" | "password", focused = false) => {
    if (errors[field]) return "#ef4444";
    return focused ? tk.inputFocus : tk.inputBorder;
  };

  return (
    <div className="min-h-screen flex">
      {}
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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="relative z-10"
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="flex justify-center mb-8"
          >
            <div
              className="w-[140px] h-[140px] rounded-[32px] flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.13)",
              }}
            >
              <AgriSenseLogo size={88} />
            </div>
          </motion.div>

          <h2
            className="font-black text-[36px] leading-[1.08] mb-3 text-white"
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              letterSpacing: "-0.03em",
            }}
          >
            Smart Farming
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#4ade80 0%,#22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Powered by AI & Solar
            </span>
          </h2>

          <p className="text-green-200/70 text-[16px] leading-relaxed mb-6">
            Monitor soil conditions in real-time, automate irrigation, and
            maximize your crop yields with our intelligent solar-powered system.
          </p>

          <div className="space-y-3">
            {[
              "Real-time soil moisture & salinity tracking",
              "AI-powered irrigation recommendations",
              "Solar energy with zero electricity costs",
              "Multi-device support for different crop zones",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-green-100/80"
              >
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-[14px]">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 text-green-200/50 text-[12px]"
        >
          © 2026 AgriSense · Sustainable farming technology
        </motion.div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative overflow-hidden"
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

        {/* Mobile logo */}
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
          <div className="mb-8">
            <h1
              className="text-[32px] font-black mb-2"
              style={{ letterSpacing: "-0.025em", color: tk.heading }}
            >
              Welcome back 👋
            </h1>
            <p className="text-[15px]" style={{ color: tk.subtext }}>
              Sign in to manage your smart farm
            </p>
          </div>

          {/* Google Button */}
          <motion.button
            whileHover={{
              scale: 1.015,
              boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
            }}
            whileTap={{ scale: 0.985 }}
            onClick={handleGoogle}
            disabled={gLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-[14px] px-4 rounded-2xl font-semibold transition-all disabled:opacity-50 mb-5"
            style={{
              background: tk.googleBg,
              border: `2px solid ${tk.googleBorder}`,
              color: tk.googleColor,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {gLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <GoogleIcon /> Continue with Google
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="flex-1 h-px"
              style={{ background: tk.dividerLine }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: tk.dividerText }}
            >
              OR SIGN IN WITH EMAIL
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: tk.dividerLine }}
            />
          </div>

          {/* ✅ form با autoComplete="on" — مهم عشان البراوزر يعرف يملّي الـ credentials صح */}
          <form
            onSubmit={handleSubmit}
            autoComplete="on"
            className="space-y-4"
            noValidate
          >
            {/* Email Field */}
            <div>
              <label
                className="block text-sm font-bold mb-1.5"
                style={{ color: tk.label }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: tk.iconColor }}
                />
                <input
                  type="text"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  className="w-full pl-11 pr-4 py-[14px] rounded-2xl outline-none transition-all text-sm font-medium"
                  style={{
                    background: tk.inputBg,
                    border: `2px solid ${borderColor("email")}`,
                    color: tk.inputColor,
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = `2px solid ${borderColor("email", true)}`)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = `2px solid ${borderColor("email")}`)
                  }
                />
              </div>
              {/* Error message */}
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs mt-1.5 flex items-center gap-1"
                >
                  <span>⚠</span> {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                className="block text-sm font-bold mb-1.5"
                style={{ color: tk.label }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: tk.iconColor }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  className="w-full pl-11 pr-12 py-[14px] rounded-2xl outline-none transition-all text-sm font-medium"
                  style={{
                    background: tk.inputBg,
                    border: `2px solid ${borderColor("password")}`,
                    color: tk.inputColor,
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = `2px solid ${borderColor("password", true)}`)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = `2px solid ${borderColor("password")}`)
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: tk.iconColor }}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* Error message */}
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs mt-1.5 flex items-center gap-1"
                >
                  <span>⚠</span> {errors.password}
                </motion.p>
              )}
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-green-600"
                />
                <span className="text-sm" style={{ color: tk.checkText }}>
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => nav("/forgot-password")}
                className="text-sm font-bold text-green-500 hover:text-green-400 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading || gLoading}
              className="w-full py-[14px] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{
                background: "linear-gradient(135deg,#16a34a 0%,#0ea5e9 100%)",
                boxShadow: "0 8px 24px rgba(22,163,74,0.28)",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <p
            className="text-center text-sm mt-6"
            style={{ color: tk.footerText }}
          >
            Don't have an account?{" "}
            <button
              onClick={() => nav("/register")}
              className="font-black text-green-500 hover:text-green-400 transition-colors"
            >
              Create account →
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
