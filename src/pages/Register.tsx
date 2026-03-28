import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
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
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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

// StrengthRow no longer needs isDark — CSS variables handle theming automatically
const StrengthRow = ({ label, valid }: { label: string; valid: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    {valid ? (
      <CheckCircle
        style={{
          width: 14,
          height: 14,
          color: "var(--success-color)",
          flexShrink: 0,
        }}
      />
    ) : (
      <XCircle
        style={{
          width: 14,
          height: 14,
          color: "var(--border-card)",
          flexShrink: 0,
        }}
      />
    )}
    <span
      style={{
        fontSize: 12,
        color: valid ? "var(--success-color)" : "var(--text-faint)",
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
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);

  // Validation functions
  const validateEmailFormat = (val: string): string => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()))
      return "Please enter a valid email address";
    return "";
  };

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

  // Queries
  const emailExists = useQuery(
    api.users.checkEmailExists,
    form.email && validateEmailFormat(form.email) === ""
      ? { email: form.email.trim().toLowerCase() }
      : "skip",
  ) as boolean | undefined;

  const nameExists = useQuery(
    api.users.checkNameExists,
    form.name && validateName(form.name) === ""
      ? { name: form.name.trim() }
      : "skip",
  ) as boolean | undefined;

  // Loading states
  const isCheckingEmail = !!(
    form.email &&
    validateEmailFormat(form.email) === "" &&
    emailExists === undefined
  );
  const isCheckingName = !!(
    form.name &&
    validateName(form.name) === "" &&
    nameExists === undefined
  );
  const isChecking = isCheckingEmail || isCheckingName;

  // Effects — only for data logic, no isDark tracking needed
  useEffect(() => {
    if (emailExists === true) {
      setErrors((prev) => ({
        ...prev,
        email: "This email is already registered . Please sign in instead.",
      }));
    } else if (
      emailExists === false &&
      errors.email ===
        "This email is already registered . Please sign in instead."
    ) {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  }, [emailExists]);

  useEffect(() => {
    if (nameExists === true) {
      setErrors((prev) => ({
        ...prev,
        name: "This full name is already taken . Please choose another.",
      }));
    } else if (
      nameExists === false &&
      errors.name === "This full name is already taken . Please choose another."
    ) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  }, [nameExists]);

  // Password strength
  const ps = {
    length: form.password.length >= 8,
    number: /\d/.test(form.password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
  };
  const psValid = Object.values(ps).every(Boolean);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleEmailBlur = () => {
    const formatErr = validateEmailFormat(form.email);
    if (formatErr) {
      setErrors((prev) => ({ ...prev, email: formatErr }));
    } else {
      setErrors((prev) => {
        if (
          prev.email ===
          "This email is already registered . Please sign in instead."
        ) {
          return prev;
        }
        return { ...prev, email: "" };
      });
    }
  };

  const validateAll = (): boolean => {
    const newErrors = { name: "", email: "", password: "", confirm: "" };
    let valid = true;

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

    if (isChecking) {
      toast.loading("Checking availability...", { id: "checking" });
      setTimeout(() => toast.dismiss("checking"), 2000);
      return false;
    }

    if (!nameErr && nameExists === true) {
      newErrors.name =
        "This full name is already taken . Please choose another.";
      valid = false;
    }
    if (!emailErr && emailExists === true) {
      newErrors.email =
        "This email is already registered . Please sign in instead.";
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

  const saveUserName = useMutation(api.users.saveUserName);

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
      console.error("Registration error:", error);

      const msg = error?.message || error?.data || "";
      const errorText = msg.toString().toLowerCase();

      if (
        errorText.includes("already") ||
        errorText.includes("exists") ||
        errorText.includes("accountalreadyexists") ||
        errorText.includes("409") ||
        errorText.includes("duplicate")
      ) {
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered. Please sign in instead.",
        }));

        toast.error("Email already registered", {
          description:
            "This email is already registered. Would you like to sign in?",
          action: {
            label: "Sign In",
            onClick: () => nav("/login"),
          },
        });
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

  // Simplified inputBase — no more tk object
  const inputBase = (field: keyof typeof errors): React.CSSProperties => ({
    width: "100%",
    padding: "14px 16px 14px 44px",
    background: "var(--glass-bg)",
    borderRadius: 16,
    outline: "none",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-primary)",
    border: `2px solid ${errors[field] ? "var(--error-color)" : "var(--border-card)"}`,
    transition: "border .2s",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* ===== LEFT PANEL (static dark green — intentionally not theme-aware) ===== */}
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

      {/* ===== RIGHT PANEL ===== */}
      <div
        className="flex-1 flex items-center justify-center p-6 pt-20 lg:pt-14 lg:p-14 relative overflow-hidden"
        style={{
          background: "var(--bg-main-gradient)",
          transition: "background 0.3s ease",
        }}
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
              opacity: 0.08,
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
              opacity: 0.06,
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
              color: "var(--text-primary)",
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
                color: "var(--text-primary)",
                marginBottom: 8,
                letterSpacing: "-0.025em",
              }}
            >
              Create Account 🌾
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
              Join AgriSense and start smart farming
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
            disabled={gLoading || loading || isChecking}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "14px 16px",
              background: "var(--glass-bg)",
              borderRadius: 16,
              fontWeight: 600,
              fontSize: 14,
              color: "var(--text-primary)",
              border: "2px solid var(--border-card)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              cursor: "pointer",
              marginBottom: 20,
              opacity: gLoading || loading || isChecking ? 0.5 : 1,
            }}
          >
            {gLoading ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid var(--border-base)",
                    borderTopColor: "var(--text-secondary)",
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

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{ flex: 1, height: 1, background: "var(--border-base)" }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-faint)",
                letterSpacing: "0.06em",
              }}
            >
              OR SIGN UP WITH EMAIL
            </span>
            <div
              style={{ flex: 1, height: 1, background: "var(--border-base)" }}
            />
          </div>

          <form
            onSubmit={handleSubmit}
            autoComplete="on"
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Full Name field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
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
                    color: "var(--text-faint)",
                  }}
                />
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={() => {
                    const formatErr = validateName(form.name);
                    if (formatErr) {
                      setErrors((prev) => ({ ...prev, name: formatErr }));
                    } else {
                      setErrors((prev) => {
                        if (nameExists === true) {
                          return {
                            ...prev,
                            name: "This full name is already . Please choose another.",
                          };
                        }
                        return { ...prev, name: "" };
                      });
                    }
                  }}
                  style={inputBase("name")}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = errors.name
                      ? "var(--error-color)"
                      : "var(--brand-500)")
                  }
                />
              </div>
              {errors.name ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 12,
                    color: "var(--error-color)",
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {errors.name}
                </motion.p>
              ) : isCheckingName ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    marginTop: 4,
                  }}
                >
                  Checking availability...
                </motion.p>
              ) : (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    marginTop: 4,
                  }}
                />
              )}
            </div>

            {/* Email field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
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
                    color: "var(--text-faint)",
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
                    (e.currentTarget.style.borderColor = errors.email
                      ? "var(--error-color)"
                      : "var(--brand-500)")
                  }
                />
              </div>
              {errors.email ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 12,
                    color: "var(--error-color)",
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {errors.email}
                </motion.p>
              ) : isCheckingEmail ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    marginTop: 4,
                  }}
                >
                  Checking availability...
                </motion.p>
              ) : (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    marginTop: 4,
                  }}
                >
                  We'll send a verification code to this email
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
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
                    color: "var(--text-faint)",
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
                    (e.currentTarget.style.borderColor = errors.password
                      ? "var(--error-color)"
                      : "var(--brand-500)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = errors.password
                      ? "var(--error-color)"
                      : "var(--border-card)")
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
                    color: "var(--text-faint)",
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
                    background: "var(--glass-bg)",
                    borderRadius: 12,
                    border: "1px solid var(--border-card)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px 16px",
                  }}
                >
                  <StrengthRow label="8+ characters" valid={ps.length} />
                  <StrengthRow label="Number" valid={ps.number} />
                  <StrengthRow label="Symbol (!@#...)" valid={ps.symbol} />
                  <StrengthRow label="Uppercase" valid={ps.upper} />
                  <StrengthRow label="Lowercase" valid={ps.lower} />
                </motion.div>
              )}

              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 12,
                    color: "var(--error-color)",
                    marginTop: 6,
                    fontWeight: 500,
                  }}
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Confirm Password field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
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
                    color: "var(--text-faint)",
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
                    (e.currentTarget.style.borderColor = errors.confirm
                      ? "var(--error-color)"
                      : "var(--brand-500)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = errors.confirm
                      ? "var(--error-color)"
                      : "var(--border-card)")
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
                    color: "var(--text-faint)",
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
                    color: "var(--error-color)",
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {errors.confirm}
                </motion.p>
              )}
            </div>

            {/* Terms checkbox */}
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
                    accentColor: "var(--brand-600)",
                    width: 15,
                    height: 15,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: agreeError
                      ? "var(--error-color)"
                      : "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    style={{ color: "var(--brand-500)", fontWeight: 700 }}
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    style={{ color: "var(--brand-500)", fontWeight: 700 }}
                  >
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
                    color: "var(--error-color)",
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  You must agree to the Terms of Service
                </motion.p>
              )}
            </div>

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading || gLoading || isChecking}
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
                cursor:
                  loading || gLoading || isChecking ? "not-allowed" : "pointer",
                background: "var(--grad-brand)",
                boxShadow: "0 8px 24px rgba(22,163,74,0.28)",
                opacity: loading || gLoading || isChecking ? 0.5 : 1,
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
              ) : isChecking ? (
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
                  Checking...
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
              color: "var(--text-faint)",
              marginTop: 20,
            }}
          >
            Already have an account?{" "}
            <button
              onClick={() => nav("/login")}
              style={{
                fontWeight: 900,
                color: "var(--brand-500)",
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
