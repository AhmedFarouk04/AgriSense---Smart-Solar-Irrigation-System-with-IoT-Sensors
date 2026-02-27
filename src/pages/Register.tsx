import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  XCircle,
  ShieldCheck,
} from "lucide-react";
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

const StrengthRow = ({ label, valid }: { label: string; valid: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    {valid ? (
      <CheckCircle
        style={{ width: 14, height: 14, color: "#16a34a", flexShrink: 0 }}
      />
    ) : (
      <XCircle
        style={{ width: 14, height: 14, color: "#d1d5db", flexShrink: 0 }}
      />
    )}
    <span
      style={{
        fontSize: 12,
        color: valid ? "#15803d" : "#9ca3af",
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  </div>
);

export default function Register() {
  const { signIn } = useAuthActions();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const ps = {
    length: form.password.length >= 8,
    number: /\d/.test(form.password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
  };
  const psValid = Object.values(ps).every(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 3)
      return toast.error("Name must be at least 3 characters");
    if (!form.email.includes("@"))
      return toast.error("Enter a valid email address");
    if (!psValid) return toast.error("Password is not strong enough");
    if (form.password !== form.confirm)
      return toast.error("Passwords don't match");
    setLoading(true);
    try {
      await signIn("password", {
        email: form.email,
        password: form.password,
        name: form.name,
        flow: "signUp",
      });
      toast.success(
        "Account created! Check your email for the verification code.",
      );
      setTimeout(() => nav("/verify"), 1500);
    } catch {
      toast.error("Email already exists or invalid data");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGLoading(true);
    try {
      await signIn("google");
    } catch {
      toast.error("Google sign-in failed");
      setGLoading(false);
    }
  };

  const inputStyle = {
    base: {
      width: "100%",
      padding: "14px 16px 14px 44px",
      background: "white",
      borderRadius: 16,
      outline: "none",
      fontSize: 14,
      fontWeight: 500,
      border: "2px solid #e5e7eb",
      transition: "border .2s",
    } as React.CSSProperties,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* ═══════════ LEFT PANEL ═══════════ */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(150deg,#071c0e 0%,#0d3320 45%,#0c3347 100%)",
        }}
      >
        {/* bg decoration */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.04,
              backgroundImage:
                "radial-gradient(rgba(255,255,255,.9) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -160,
              right: -160,
              width: 500,
              height: 500,
              borderRadius: "50%",
              opacity: 0.07,
              background: "radial-gradient(circle,#4ade80,transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -160,
              left: -160,
              width: 400,
              height: 400,
              borderRadius: "50%",
              opacity: 0.07,
              background: "radial-gradient(circle,#38bdf8,transparent 70%)",
            }}
          />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 8,
              borderRadius: 16,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <AgriSenseLogo size={38} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Fraunces',Georgia,serif",
                fontSize: 22,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              AgriSense
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#4ade80",
              }}
            >
              Smart Solar Irrigation
            </div>
          </div>
        </motion.div>

        {/* Center hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ position: "relative", zIndex: 10 }}
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 148,
                height: 148,
                borderRadius: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              fontSize: 40,
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "white",
              marginBottom: 16,
            }}
          >
            Join the Future
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#4ade80 0%,#22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              of Farming 🌱
            </span>
          </h2>
          <p
            style={{
              color: "rgba(187,247,208,0.7)",
              fontSize: 17,
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            Create your free account and start saving water, boosting yields,
            and farming smarter from day one.
          </p>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
            }}
          >
            {[
              ["10K+", "Farmers"],
              ["50K+", "Acres"],
              ["30%", "Water Saved"],
            ].map(([n, l], i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.1 }}
                style={{
                  textAlign: "center",
                  padding: "16px 8px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Fraunces',Georgia,serif",
                    fontSize: 22,
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(134,239,172,0.7)",
                    marginTop: 2,
                  }}
                >
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
          style={{
            position: "relative",
            zIndex: 10,
            padding: 20,
            borderRadius: 16,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
            {[...Array(5)].map((_, i) => (
              <span key={i} style={{ color: "#fbbf24", fontSize: 13 }}>
                ★
              </span>
            ))}
          </div>
          <p
            style={{
              color: "rgba(209,250,229,0.8)",
              fontSize: 13,
              lineHeight: 1.65,
              fontStyle: "italic",
            }}
          >
            "Setup took less than 10 minutes. Within a week, AgriSense had
            already optimized my irrigation schedule and cut my water bill
            significantly."
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 14,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 11,
                fontWeight: 900,
                background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
              }}
            >
              SM
            </div>
            <div>
              <div style={{ color: "white", fontSize: 13, fontWeight: 700 }}>
                Sara Al-Mutairi
              </div>
              <div style={{ color: "#4ade80", fontSize: 11 }}>
                Greenhouse Owner · Dubai, UAE
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════ RIGHT PANEL ═══════════ */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg,#f0fdf4 0%,#ffffff 50%,#eff6ff 100%)",
        }}
      >
        {/* bg blobs */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -128,
              right: -128,
              width: 384,
              height: 384,
              borderRadius: "50%",
              opacity: 0.25,
              filter: "blur(48px)",
              background: "radial-gradient(circle,#bbf7d0,transparent)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -128,
              left: -128,
              width: 384,
              height: 384,
              borderRadius: "50%",
              opacity: 0.18,
              filter: "blur(48px)",
              background: "radial-gradient(circle,#bfdbfe,transparent)",
            }}
          />
        </div>

        {/* Mobile logo */}
        <div
          className="lg:hidden"
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AgriSenseLogo size={34} />
          <span
            style={{
              fontFamily: "'Fraunces',Georgia,serif",
              fontWeight: 900,
              color: "#111827",
              fontSize: 18,
            }}
          >
            AgriSense
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: 440,
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#111827",
                marginBottom: 8,
                letterSpacing: "-0.025em",
              }}
            >
              Create Account 🌾
            </h1>
            <p style={{ color: "#6b7280", fontSize: 15 }}>
              Join AgriSense and start smart farming
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
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "14px 16px",
              background: "white",
              borderRadius: 16,
              fontWeight: 600,
              fontSize: 14,
              color: "#374151",
              border: "2px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              cursor: "pointer",
              marginBottom: 20,
              opacity: gLoading || loading ? 0.5 : 1,
            }}
          >
            {gLoading ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid #d1d5db",
                    borderTopColor: "#374151",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />{" "}
                Redirecting to Google...
              </>
            ) : (
              <>
                <GoogleIcon /> Continue with Google
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9ca3af",
                letterSpacing: "0.06em",
              }}
            >
              OR SIGN UP WITH EMAIL
            </span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Full Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Full Name *
              </label>
              <div style={{ position: "relative" }}>
                <User
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "#9ca3af",
                  }}
                />
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Ahmed Al-Mutairi"
                  style={inputStyle.base}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "2px solid #16a34a")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = "2px solid #e5e7eb")
                  }
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Email Address *
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "#9ca3af",
                  }}
                />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="farmer@gmail.com"
                  style={inputStyle.base}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "2px solid #16a34a")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = "2px solid #e5e7eb")
                  }
                />
              </div>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                We'll send a verification code to this email
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Password *
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "#9ca3af",
                  }}
                />
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  style={{ ...inputStyle.base, paddingRight: 48 }}
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
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    padding: 0,
                  }}
                >
                  {showPass ? (
                    <EyeOff style={{ width: 16, height: 16 }} />
                  ) : (
                    <Eye style={{ width: 16, height: 16 }} />
                  )}
                </button>
              </div>

              {/* Strength indicators */}
              {form.password && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 10,
                    padding: "12px 14px",
                    background: "#f9fafb",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px 16px",
                  }}
                >
                  <StrengthRow label="8+ characters" valid={ps.length} />
                  <StrengthRow label="Number" valid={ps.number} />
                  <StrengthRow label="Symbol" valid={ps.symbol} />
                  <StrengthRow label="Uppercase" valid={ps.upper} />
                  <StrengthRow label="Lowercase" valid={ps.lower} />
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Confirm Password *
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "#9ca3af",
                  }}
                />
                <input
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  style={{
                    ...inputStyle.base,
                    paddingRight: 48,
                    borderColor:
                      form.confirm && form.password !== form.confirm
                        ? "#ef4444"
                        : "#e5e7eb",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "2px solid #16a34a")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border =
                      form.confirm && form.password !== form.confirm
                        ? "2px solid #ef4444"
                        : "2px solid #e5e7eb")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    padding: 0,
                  }}
                >
                  {showConfirm ? (
                    <EyeOff style={{ width: 16, height: 16 }} />
                  ) : (
                    <Eye style={{ width: 16, height: 16 }} />
                  )}
                </button>
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#ef4444",
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Terms */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                required
                style={{
                  marginTop: 2,
                  accentColor: "#16a34a",
                  width: 15,
                  height: 15,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                I agree to the{" "}
                <a href="#" style={{ color: "#16a34a", fontWeight: 700 }}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" style={{ color: "#16a34a", fontWeight: 700 }}>
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading || gLoading}
              style={{
                width: "100%",
                padding: "14px 16px",
                color: "white",
                borderRadius: 16,
                fontWeight: 900,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg,#16a34a 0%,#0ea5e9 100%)",
                boxShadow: "0 8px 24px rgba(22,163,74,0.38)",
                opacity: loading || gLoading ? 0.5 : 1,
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
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account{" "}
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </motion.button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              color: "#6b7280",
              marginTop: 20,
            }}
          >
            Already have an account?{" "}
            <button
              onClick={() => nav("/login")}
              style={{
                fontWeight: 900,
                color: "#16a34a",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Sign in →
            </button>
          </p>

          {/* Trust badge */}
          <div
            style={{
              marginTop: 24,
              padding: "14px 16px",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(22,163,74,0.06)",
              border: "1px solid rgba(22,163,74,0.14)",
            }}
          >
            <ShieldCheck
              style={{ width: 20, height: 20, color: "#16a34a", flexShrink: 0 }}
            />
            <p style={{ fontSize: 12, color: "#166534" }}>
              <strong>256-bit SSL encrypted</strong> — your farm data is fully
              protected and never shared with third parties.
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
