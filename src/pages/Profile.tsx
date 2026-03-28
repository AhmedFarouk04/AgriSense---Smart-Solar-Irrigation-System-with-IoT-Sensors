import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Crop,
  Save,
  Camera,
  Mail,
  Building,
  Ruler,
  LogOut,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 6, y: 70, size: 6, color: "var(--particle-3)", delay: 1.5 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
  { x: 75, y: 40, size: 6, color: "var(--particle-3)", delay: 1.8 },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
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
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-card)",
        borderRadius: 20,
        padding: "24px",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ color: "var(--brand-500)" }}>{icon}</div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "var(--glass-bg)",
  border: "1.5px solid var(--border-card)",
  borderRadius: 12,
  color: "var(--text-primary)",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  fontFamily: "var(--font-body)",
};

export default function Profile() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getProfile);
  const updateProfile = useMutation(api.users.updateUserProfile);

  const [scrolled, setScrolled] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmArea, setFarmArea] = useState("");
  const [farmAreaUnit, setFarmAreaUnit] = useState("m2");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !initialized) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setFarmName(user.farmName ?? "");
      setFarmArea(user.farmArea?.toString() ?? "");
      setFarmAreaUnit(user.farmAreaUnit ?? "m2");
      setLocation(user.location ?? "");
      setRole(user.role ?? "");
      setInitialized(true);
    }
  }, [user, initialized]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        farmName: farmName.trim() || undefined,
        farmArea: farmArea ? Number(farmArea) : undefined,
        farmAreaUnit: farmAreaUnit || undefined,
        location: location.trim() || undefined,
        role: role.trim() || undefined,
      });
      toast.success("Profile saved! ✅");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      nav("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (user === undefined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-page)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid var(--border-card)",
            borderTopColor: "var(--brand-500)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (user === null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#070d09",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e8f5e9",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>User not found</div>
          <button
            onClick={() => nav("/dashboard")}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              background: "var(--grad-brand)",
              border: "none",
              borderRadius: 12,
              color: "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main-gradient)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Background Decor */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          className="grid-pattern"
          style={{ position: "absolute", inset: 0, opacity: 0.4 }}
        />
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -18, 0], opacity: [0.25, 0.7, 0.25] }}
            transition={{
              duration: 5 + p.delay,
              repeat: Infinity,
              delay: p.delay,
            }}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
            }}
          />
        ))}
      </div>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "var(--bg-nav)" : "transparent",
          backdropFilter: scrolled ? "blur(32px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
          transition: "all 0.35s ease",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => nav("/dashboard")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <User size={15} style={{ color: "var(--brand-500)" }} />
                My Profile
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  letterSpacing: "0.04em",
                }}
              >
                Manage your account & farm
              </div>
            </div>
          </div>
          <motion.a
            href="/dashboard"
            whileHover={{ scale: 1.02 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <AgriSenseLogo size={34} />
            <span
              className="fd grad-text"
              style={{ fontSize: 18, fontWeight: 900 }}
            >
              AgriSense
            </span>
          </motion.a>
        </div>
      </header>

      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-card)",
            borderRadius: 20,
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--grad-brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
                color: "var(--text-primary)",
                boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
              }}
            >
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--bg-card)",
                border: "2px solid var(--border-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={11} color="var(--text-muted)" />
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {user.name}
            </div>
            <div
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}
            >
              {user.email}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: user.emailVerificationTime
                    ? "#4ade80"
                    : "#f87171",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: user.emailVerificationTime ? "#4ade80" : "#f87171",
                  fontWeight: 600,
                }}
              >
                {user.emailVerificationTime ? "Verified" : "Not verified"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Personal Info */}
        <Section title="Personal Info" icon={<User size={16} />}>
          <Field label="Full Name *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Email">
            <div
              style={{
                ...inputStyle,
                color: "var(--text-muted)",
                cursor: "default",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Mail size={14} style={{ flexShrink: 0 }} />
              {user.email ?? "—"}
            </div>
          </Field>
          <Field label="Phone Number">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              placeholder="+20 xxx xxx xxxx"
              type="tel"
            />
          </Field>
          <Field label="Role / Occupation">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select role</option>
              <option value="farmer">Farmer</option>
              <option value="agronomist">Agronomist</option>
              <option value="farm_manager">Farm Manager</option>
              <option value="researcher">Researcher</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </Section>

        {/* Farm Info */}
        <Section title="Farm Info" icon={<Building size={16} />}>
          <Field label="Farm Name">
            <input
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              style={inputStyle}
              placeholder='e.g. "Ahmed Farm"'
            />
          </Field>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 10,
            }}
          >
            <Field label="Total Farm Area">
              <input
                value={farmArea}
                onChange={(e) => setFarmArea(e.target.value)}
                style={inputStyle}
                placeholder="e.g. 5000"
                type="number"
                min={0}
              />
            </Field>
            <Field label="Unit">
              <select
                value={farmAreaUnit}
                onChange={(e) => setFarmAreaUnit(e.target.value)}
                style={{ ...inputStyle, minWidth: 100 }}
              >
                <option value="m2">m²</option>
                <option value="feddan">Feddan</option>
                <option value="acre">Acre</option>
                <option value="hectare">Hectare</option>
              </select>
            </Field>
          </div>
          <Field label="Location" hint="City, region or coordinates">
            <div style={{ position: "relative" }}>
              <MapPin
                size={14}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-faint)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 36 }}
                placeholder="e.g. Dakahlia, Egypt"
              />
            </div>
          </Field>
        </Section>

        {/* Stats */}
        <Section title="Account Stats" icon={<Mail size={16} />}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {[
              {
                label: "Member since",
                value: new Date(user._creationTime).toLocaleDateString(
                  "en-US",
                  { month: "short", year: "numeric" },
                ),
              },
              {
                label: "Email status",
                value: user.emailVerificationTime
                  ? "✅ Verified"
                  : "❌ Unverified",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--border-base)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-faint)",
                    fontWeight: 600,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--grad-brand)",
              border: "none",
              borderRadius: 16,
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <>
                <Save size={16} /> Save Profile
              </>
            )}
          </motion.button>

          {/* الزرار بتاع تسجيل الخروج */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "14px",
              background: "rgba(248,113,113,0.05)",
              border: "1.5px solid rgba(248,113,113,0.15)",
              borderRadius: 16,
              color: "#f87171",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <LogOut size={16} /> Logout from AgriSense
          </motion.button>
        </div>
      </main>
    </div>
  );
}
