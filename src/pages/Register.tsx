import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
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
  Check,
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
      <CheckCircle
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

const nameRules = {
  length: (v: string) => v.trim().length >= 3 && v.trim().length <= 30,
  noNumbers: (v: string) => !/\d/.test(v),
  noSpecial: (v: string) => !/[!@#$%^&*(),.?":{}|<>_\-=+\[\]\\\/]/.test(v),
  noConsecutiveSpaces: (v: string) => !/\s{2,}/.test(v),
  lettersOnly: (v: string) => /^[a-zA-Z\u0600-\u06FF\s]+$/.test(v.trim()),
};

export default function Register() {
  const { signIn } = useAuthActions();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // ✅ agreed state
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);

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
    length: form.password.length >= 8,
    number: /\d/.test(form.password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
  };
  const psValid = Object.values(ps).every(Boolean);

  const validateName = (val: string): string => {
    if (!val.trim()) return "Full name is required";
    if (!nameRules.length(val)) return "Name must be 3–30 characters";
    if (!nameRules.lettersOnly(val))
      return "Name can only contain letters and spaces";
    if (!nameRules.noNumbers(val)) return "Name cannot contain numbers";
    if (!nameRules.noSpecial(val))
      return "Name cannot contain special characters";
    if (!nameRules.noConsecutiveSpaces(val))
      return "No consecutive spaces allowed";
    return "";
  };

  const validateEmailFormat = (val: string): string => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()))
      return "Please enter a valid email address";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleEmailBlur = () => {
    const err = validateEmailFormat(form.email);
    if (err) setErrors((prev) => ({ ...prev, email: err }));
  };

  const validateAll = (): boolean => {
    const newErrors = { name: "", email: "", password: "", confirm: "" };
    let valid = true;

    // ✅ validate agreed first
    if (!agreed) {
      setAgreeError(true);
      valid = false;
    }

    const nameErr = validateName(form.name);
    if (nameErr) {
      newErrors.name = nameErr;
      valid = false;
    }
    const emailErr = validateEmailFormat(form.email);
    if (emailErr) {
      newErrors.email = emailErr;
      valid = false;
    }
    if (!form.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (!psValid) {
      newErrors.password = "Password does not meet all requirements";
      valid = false;
    }
    if (!form.confirm) {
      newErrors.confirm = "Please confirm your password";
      valid = false;
    } else if (form.password !== form.confirm) {
      newErrors.confirm = "Passwords do not match";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    try {
      await signIn("password", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim(),
        flow: "signUp",
      });

      sessionStorage.setItem(
        "verificationEmail",
        form.email.trim().toLowerCase(),
      );

      nav("/verify");
    } catch (error: any) {
      const msg: string = error?.message ?? "";
      if (
        msg.includes("already") ||
        msg.includes("exists") ||
        msg.includes("AccountAlreadyExists")
      ) {
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered",
        }));
      } else {
        toast.error("Something went wrong. Please try again.");
      }
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
        strengthBg: "#0a1a0d",
        strengthBorder: "#1a3020",
        hintText: "rgba(255,255,255,0.28)",
        termsText: "rgba(255,255,255,0.45)",
        footerText: "rgba(255,255,255,0.38)",
        mobileName: "#e8f5e9",
        errorColor: "#f87171",
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
        strengthBg: "#f9fafb",
        strengthBorder: "#e5e7eb",
        hintText: "#9ca3af",
        termsText: "#6b7280",
        footerText: "#6b7280",
        mobileName: "#111827",
        errorColor: "#ef4444",
      };

  const inputBase = (field: keyof typeof errors): React.CSSProperties => ({
    width: "100%",
    padding: "14px 16px 14px 44px",
    background: tk.inputBg,
    borderRadius: 16,
    outline: "none",
    fontSize: 14,
    fontWeight: 500,
    color: tk.inputColor,
    border: `2px solid ${errors[field] ? tk.errorColor : tk.inputBorder}`,
    transition: "border .2s",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(150deg,#071c0e 0%,#0d3320 45%,#0c3347 100%)",
        }}
      >
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
                boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
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
              marginBottom: 32,
            }}
          >
            Create your free account and start saving water, boosting yields,
            and farming smarter from day one.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              "Real-time soil moisture & salinity tracking",
              "AI-powered irrigation recommendations",
              "Solar energy with zero electricity costs",
              "Multi-device support for different crop zones",
              "Automated alerts and scheduled irrigation",
            ].map((item) => (
              <div
                key={item}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(74,222,128,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Check style={{ width: 13, height: 13, color: "#4ade80" }} />
                </div>
                <span
                  style={{
                    fontSize: 14,
                    color: "rgba(209,250,229,0.85)",
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            position: "relative",
            zIndex: 10,
            color: "rgba(187,247,208,0.5)",
            fontSize: 12,
          }}
        >
          © 2026 AgriSense · Sustainable farming technology
        </motion.div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-14 relative overflow-hidden"
        style={{ background: tk.panelBg, transition: "background 0.3s ease" }}
      >
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
              opacity: tk.blob1Op,
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
              opacity: tk.blob2Op,
              filter: "blur(48px)",
              background: "radial-gradient(circle,#bfdbfe,transparent)",
            }}
          />
        </div>
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
              color: tk.mobileName,
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
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: tk.heading,
                marginBottom: 8,
                letterSpacing: "-0.025em",
              }}
            >
              Create Account 🌾
            </h1>
            <p style={{ color: tk.subtext, fontSize: 15 }}>
              Join AgriSense and start smart farming
            </p>
          </div>

          <motion.button
            whileHover={{
              scale: 1.015,
              boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
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
              background: tk.googleBg,
              borderRadius: 16,
              fontWeight: 600,
              fontSize: 14,
              color: tk.googleColor,
              border: `2px solid ${tk.googleBorder}`,
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
                Redirecting...
              </>
            ) : (
              <>
                <GoogleIcon /> Continue with Google
              </>
            )}
          </motion.button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ flex: 1, height: 1, background: tk.dividerLine }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: tk.dividerText,
                letterSpacing: "0.06em",
              }}
            >
              OR SIGN UP WITH EMAIL
            </span>
            <div style={{ flex: 1, height: 1, background: tk.dividerLine }} />
          </div>

          <form
            onSubmit={handleSubmit}
            autoComplete="on"
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Full Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: tk.label,
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
                    color: tk.iconColor,
                  }}
                />
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      name: validateName(form.name),
                    }))
                  }
                  style={inputBase("name")}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = `2px solid ${errors.name ? tk.errorColor : tk.inputFocus}`)
                  }
                />
              </div>
              {errors.name ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 12,
                    color: tk.errorColor,
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  ⚠ {errors.name}
                </motion.p>
              ) : (
                <p
                  style={{ fontSize: 12, color: tk.hintText, marginTop: 4 }}
                ></p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: tk.label,
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
                    color: tk.iconColor,
                  }}
                />
                <input
                  name="email"
                  type="text"
                  autoComplete="username"
                  inputMode="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  style={inputBase("email")}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = `2px solid ${errors.email ? tk.errorColor : tk.inputFocus}`)
                  }
                />
              </div>
              {errors.email ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 12,
                    color: tk.errorColor,
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  ⚠ {errors.email}
                </motion.p>
              ) : (
                <p style={{ fontSize: 12, color: tk.hintText, marginTop: 4 }}>
                  We'll send a verification code to this email
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: tk.label,
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
                    color: tk.iconColor,
                  }}
                />
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  style={{ ...inputBase("password"), paddingRight: 48 }}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = `2px solid ${errors.password ? tk.errorColor : tk.inputFocus}`)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = `2px solid ${errors.password ? tk.errorColor : tk.inputBorder}`)
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
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
                  {showPass ? (
                    <EyeOff style={{ width: 16, height: 16 }} />
                  ) : (
                    <Eye style={{ width: 16, height: 16 }} />
                  )}
                </button>
              </div>
              {form.password && (
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
              {errors.password && (
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
                  ⚠ {errors.password}
                </motion.p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: tk.label,
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
                    color: tk.iconColor,
                  }}
                />
                <input
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={handleChange}
                  style={{ ...inputBase("confirm"), paddingRight: 48 }}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = `2px solid ${errors.confirm ? tk.errorColor : tk.inputFocus}`)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = `2px solid ${errors.confirm ? tk.errorColor : tk.inputBorder}`)
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
                    <EyeOff style={{ width: 16, height: 16 }} />
                  ) : (
                    <Eye style={{ width: 16, height: 16 }} />
                  )}
                </button>
              </div>
              {errors.confirm && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 12,
                    color: tk.errorColor,
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  ⚠ {errors.confirm}
                </motion.p>
              )}
            </div>

            {/* ✅ Terms checkbox with manual validation */}
            <div>
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
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (e.target.checked) setAgreeError(false);
                  }}
                  style={{
                    marginTop: 2,
                    accentColor: "#16a34a",
                    width: 15,
                    height: 15,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: agreeError ? tk.errorColor : tk.termsText,
                    lineHeight: 1.5,
                  }}
                >
                  I agree to the{" "}
                  <a href="#" style={{ color: "#22c55e", fontWeight: 700 }}>
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" style={{ color: "#22c55e", fontWeight: 700 }}>
                    Privacy Policy
                  </a>
                </span>
              </label>
              {agreeError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 12,
                    color: tk.errorColor,
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  ⚠ You must agree to the Terms of Service
                </motion.p>
              )}
            </div>

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
                cursor: loading || gLoading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg,#16a34a 0%,#0ea5e9 100%)",
                boxShadow: "0 8px 24px rgba(22,163,74,0.28)",
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
              color: tk.footerText,
              marginTop: 20,
            }}
          >
            Already have an account?{" "}
            <button
              onClick={() => nav("/login")}
              style={{
                fontWeight: 900,
                color: "#22c55e",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Sign in →
            </button>
          </p>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
