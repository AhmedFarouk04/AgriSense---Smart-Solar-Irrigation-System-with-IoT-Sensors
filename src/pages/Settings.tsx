import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Bell,
  Moon,
  Globe,
  Shield,
  LogOut,
  ChevronRight,
  Check,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";
import { useAuthActions } from "@convex-dev/auth/react";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
  { x: 75, y: 40, size: 6, color: "var(--particle-3)", delay: 1.8 },
];

function SettingRow({
  icon,
  title,
  subtitle,
  children,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid var(--border-base)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: danger ? "rgba(248,113,113,0.1)" : "var(--glass-bg)",
            border: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "var(--border-card)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: danger ? "#f87171" : "var(--brand-500)",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: danger ? "#f87171" : "var(--text-primary)",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? "var(--brand-600)" : "rgba(255,255,255,0.1)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.3s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: value ? 22 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.3s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-card)",
        borderRadius: 20,
        padding: "20px 24px",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-faint)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { signOut } = useAuthActions();
  const userSettings = useQuery(api.users.getSettings);
  const updateSettings = useMutation(api.users.updateSettings);

  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (userSettings) {
      setNotifications(userSettings.notificationsEnabled ?? true);
    }
  }, [userSettings]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleToggleNotifications = async (v: boolean) => {
    setNotifications(v);
    try {
      await updateSettings({ notificationsEnabled: v });
      toast.success(v ? "Notifications enabled" : "Notifications disabled");
    } catch {
      setNotifications(!v);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      nav("/");
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        // ✅ تم إضافة الخلفية المتدرجة
        background: `radial-gradient(ellipse 120% 60% at 50% 0%, #162e1a 0%, #0d2318 30%, transparent 60%), radial-gradient(ellipse 80% 60% at 0% 50%, rgba(15,43,24,0.9) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 100% 50%, rgba(11,30,36,0.7) 0%, transparent 60%), radial-gradient(ellipse 100% 50% at 50% 100%, rgba(15,43,24,0.5) 0%, transparent 60%), #070d09`,
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Background */}
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

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(7,13,9,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(32px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(32px)" : "none",
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
                <SettingsIcon size={15} style={{ color: "var(--brand-500)" }} />{" "}
                Settings
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  letterSpacing: "0.04em",
                }}
              >
                App preferences
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
          maxWidth: 600,
          margin: "0 auto",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Section title="Notifications">
            <SettingRow
              icon={<Bell size={16} />}
              title="Push Notifications"
              subtitle="Alerts for pump events and sensor warnings"
            >
              <Toggle
                value={notifications}
                onChange={handleToggleNotifications}
              />
            </SettingRow>
            <SettingRow
              icon={<Bell size={16} />}
              title="Low Moisture Alerts"
              subtitle="Notify when moisture drops below threshold"
            >
              <Toggle
                value={notifications}
                onChange={handleToggleNotifications}
              />
            </SettingRow>
          </Section>
        </motion.div>

        {/* Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Section title="Data & Privacy">
            <SettingRow
              icon={<Shield size={16} />}
              title="Data Retention"
              subtitle="Sensor readings kept for 7 days"
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-faint)",
                  background: "var(--glass-bg)",
                  padding: "4px 10px",
                  borderRadius: 99,
                  border: "1px solid var(--border-base)",
                }}
              >
                7 days
              </span>
            </SettingRow>
            <SettingRow
              icon={<Globe size={16} />}
              title="Language"
              subtitle="App language"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                English <ChevronRight size={14} />
              </div>
            </SettingRow>
          </Section>
        </motion.div>

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Section title="Account">
            <SettingRow
              icon={<LogOut size={16} />}
              title="Sign Out"
              subtitle="Sign out of your account"
              danger
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSignOut}
                disabled={signingOut}
                style={{
                  padding: "7px 16px",
                  borderRadius: 10,
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.25)",
                  color: "#f87171",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: signingOut ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: signingOut ? 0.6 : 1,
                }}
              >
                {signingOut ? (
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(248,113,113,0.3)",
                      borderTopColor: "#f87171",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                ) : (
                  <LogOut size={14} />
                )}
                {signingOut ? "Signing out..." : "Sign Out"}
              </motion.button>
            </SettingRow>
          </Section>
        </motion.div>

        {/* App info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              color: "var(--text-faint)",
              fontSize: 12,
            }}
          >
            <div
              className="fd grad-text"
              style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}
            >
              AgriSense
            </div>
            <div>Version 1.0.0 · Smart Solar Irrigation</div>
            <div style={{ marginTop: 4 }}>
              Made with 💚 for sustainable farming
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
