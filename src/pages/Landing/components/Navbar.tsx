import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AgriSenseLogo } from "./Logo";

interface NavbarProps {
  scrolled: boolean;
  isDark: boolean;
}

export function Navbar({ scrolled, isDark }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: scrolled ? "10px 24px" : "16px 24px",
        background: scrolled ? "var(--bg-nav)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
        boxShadow: scrolled ? "var(--shadow-sm)" : "none",
        transition: "all 0.35s ease",
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
        {/* ── Logo */}
        <motion.a
          href="/"
          whileHover={{ scale: 1.02 }}
          style={{ display: "flex", alignItems: "center", gap: 11 }}
        >
          <motion.div
            whileHover={{ rotate: [0, -7, 7, 0] }}
            transition={{ duration: 0.5 }}
            style={{
              filter: "drop-shadow(0 4px 14px rgba(22,163,74,.30))",
              flexShrink: 0,
            }}
          >
            <AgriSenseLogo size={46} />
          </motion.div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1,
              gap: 3,
            }}
          >
            <span
              className="fd grad-text"
              style={{
                fontSize: 21,
                fontWeight: 900,
                letterSpacing: "-0.025em",
              }}
            >
              AgriSense
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
              }}
            >
              Smart Solar Irrigation
            </span>
          </div>
        </motion.a>

        {/* ── Center links */}
        <div className="hide-mob" style={{ display: "flex", gap: 36 }}>
          {["Features", "How it Works", "Contact"].map((n) => (
            <a
              key={n}
              href={`#${n.toLowerCase().replace(/ /g, "-")}`}
              className="nav-a"
            >
              {n}
            </a>
          ))}
        </div>

        {/* ── Auth + burger */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.a
            href="/login"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="hide-mob"
            style={{
              padding: "9px 22px",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 12,
              border: "1.5px solid var(--border-card)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(8px)",
              transition: "all 0.25s ease",
            }}
          >
            Login
          </motion.a>
          <motion.a
            href="/register"
            whileHover={{
              scale: 1.04,
              boxShadow: "0 8px 28px rgba(22,163,74,.42)",
            }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "9px 22px",
              background: "var(--grad-brand)",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 12,
              boxShadow: "var(--shadow-md)",
            }}
          >
            Get Started
          </motion.a>
          <button
            className="burger"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: "16px 24px 24px",
              borderTop: "1px solid var(--border-card)",
              background: "var(--bg-nav)",
              backdropFilter: "blur(20px)",
            }}
          >
            {["Features", "How it Works", "Contact"].map((n) => (
              <a
                key={n}
                href={`#${n.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 0",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  borderBottom: "1px solid var(--border-base)",
                }}
              >
                {n}
              </a>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <a
                href="/login"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "10px",
                  border: "1.5px solid var(--border-card)",
                  borderRadius: 12,
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: 14,
                  background: "var(--glass-bg)",
                }}
              >
                Login
              </a>
              <a
                href="/register"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: 12,
                  color: "white",
                  fontWeight: 700,
                  fontSize: 14,
                  background: "var(--grad-brand)",
                }}
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
