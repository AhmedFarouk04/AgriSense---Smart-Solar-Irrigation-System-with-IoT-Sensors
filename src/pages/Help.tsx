import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Book,
  Wifi,
  Droplets,
  Power,
  Plus,
  Settings,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
];

const FAQS = [
  {
    q: "How do I add a new zone?",
    a: "Click 'Add Zone' from the dashboard. You'll need your Firebase Realtime Database URL and secret key. Follow the 3-step setup wizard.",
    icon: <Plus size={16} />,
  },
  {
    q: "Why is my sensor showing no data?",
    a: "Make sure your device is powered on and connected to WiFi. Check that the Firebase URL and secret in zone settings are correct. Data refreshes every 30 seconds.",
    icon: <Wifi size={16} />,
  },
  {
    q: "How does pump control work?",
    a: "The pump toggle in the dashboard sends a command to your Firebase database. Your device reads the control/pump value and activates or deactivates the pump accordingly.",
    icon: <Power size={16} />,
  },
  {
    q: "What do the moisture levels mean?",
    a: "Below 30% is Dry (needs irrigation), 30-70% is Good (optimal range), above 70% is Wet (too much water). You can customize these thresholds in Zone Settings.",
    icon: <Droplets size={16} />,
  },
  {
    q: "How do I set custom thresholds?",
    a: "Go to Dashboard → click the ⚙️ settings icon next to your zone → Smart Thresholds section. Set your own min/max moisture and optimal temperature values.",
    icon: <Settings size={16} />,
  },
  {
    q: "How long is data stored?",
    a: "Sensor readings are kept for 7 days. Events and notifications are kept for the last 100 entries. You can view historical data in the Reports section.",
    icon: <Book size={16} />,
  },
  {
    q: "What Firebase path does the device use?",
    a: "The app reads from: sensor/moisture, sensor/air_temp, sensor/flow_rate, and control/pump. Make sure your device writes data to these exact paths.",
    icon: <Wifi size={16} />,
  },
];

function FAQItem({ faq, index }: { faq: (typeof FAQS)[0]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${open ? "var(--brand-500)" : "var(--border-card)"}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "16px 18px",
          background: "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              flexShrink: 0,
              background: open ? "rgba(74,222,128,0.12)" : "var(--glass-bg)",
              border: `1px solid ${open ? "rgba(74,222,128,0.25)" : "var(--border-base)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: open ? "var(--brand-500)" : "var(--text-muted)",
              transition: "all 0.2s",
            }}
          >
            {faq.icon}
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: open ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            {faq.q}
          </span>
        </div>
        <div style={{ color: "var(--text-faint)", flexShrink: 0 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "0 18px 16px 62px",
                fontSize: 14,
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Help() {
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const filtered = FAQS.filter((f) =>
    search === ""
      ? true
      : f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main-gradient)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
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
          background: scrolled ? "var(--bg-nav)" : "transparent",
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
                <HelpCircle size={15} style={{ color: "var(--brand-500)" }} />
                Help & Support
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  letterSpacing: "0.04em",
                }}
              >
                FAQs and contact
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
          maxWidth: 680,
          margin: "0 auto",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          <h1
            className="fd"
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "var(--text-primary)",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            How can we <span className="grad-text">help?</span>
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              marginBottom: 24,
            }}
          >
            Find answers to common questions about AgriSense.
          </p>

          {/* Search */}
          <div
            style={{ position: "relative", maxWidth: 400, margin: "0 auto" }}
          >
            <HelpCircle
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-faint)",
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                background: "var(--glass-bg)",
                border: "1.5px solid var(--border-card)",
                borderRadius: 14,
                color: "var(--text-primary)",
                fontSize: 14,
                outline: "none",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>
        </motion.div>

        {/* FAQs */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 40,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "var(--text-muted)",
              }}
            >
              No results for "{search}"
            </div>
          ) : (
            filtered.map((faq, i) => <FAQItem key={i} faq={faq} index={i} />)
          )}
        </div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-card)",
            borderRadius: 20,
            padding: "28px 24px",
            textAlign: "center",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 10 }}>💬</div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Still need help?
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 20,
            }}
          >
            Our team is happy to help you get the most out of AgriSense.
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <motion.a
              href="mailto:hello@agrisense.io"
              whileHover={{ scale: 1.03 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "var(--grad-brand)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              <Mail size={14} /> Email Support
            </motion.a>
            <motion.a
              href="#"
              whileHover={{ scale: 1.03 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                borderRadius: 12,
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              <Book size={14} /> Documentation
            </motion.a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
