import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AgriSenseLogo } from "./Logo";

interface NavbarProps {
  scrolled: boolean;
}

export function Navbar({ scrolled }: NavbarProps) {
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
        padding: scrolled ? "10px 24px" : "15px 24px",
        background: scrolled
          ? "rgba(247,253,243,.94)"
          : "rgba(247,253,243,.65)",
        backdropFilter: "blur(24px)",
        borderBottom: `1px solid ${scrolled ? "rgba(22,163,74,.14)" : "transparent"}`,
        boxShadow: scrolled ? "0 4px 28px rgba(22,163,74,.07)" : "none",
        transition: "all .35s ease",
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
        {/* Logo */}
        <motion.a
          href="/"
          whileHover={{ scale: 1.02 }}
          style={{ display: "flex", alignItems: "center", gap: 11 }}
        >
          <motion.div
            whileHover={{ rotate: [0, -7, 7, 0] }}
            transition={{ duration: 0.5 }}
            style={{
              filter: "drop-shadow(0 4px 14px rgba(22,163,74,.3))",
              flexShrink: 0,
            }}
          >
            <AgriSenseLogo size={48} />
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
              className="fd grad"
              style={{
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: "-0.02em",
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
                color: "#9ca3af",
              }}
            >
              Smart Solar Irrigation
            </span>
          </div>
        </motion.a>

        {/* Center links */}
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

        {/* Auth + burger */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.a
            href="/login"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="hide-mob"
            style={{
              padding: "9px 22px",
              color: "#374151",
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 12,
              border: "1.5px solid #e5e7eb",
              background: "white",
              boxShadow: "0 1px 4px rgba(0,0,0,.06)",
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
              background: "linear-gradient(135deg,#16a34a 0%,#0ea5e9 100%)",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 12,
              boxShadow: "0 4px 18px rgba(22,163,74,.35)",
            }}
          >
            Sign Up Free
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
              color: "#374151",
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "16px 24px 24px",
            borderTop: "1px solid rgba(22,163,74,.1)",
            background: "rgba(247,253,243,.98)",
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
                color: "#374151",
                fontWeight: 500,
                borderBottom: "1px solid rgba(0,0,0,.05)",
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
                border: "1.5px solid #e5e7eb",
                borderRadius: 12,
                color: "#374151",
                fontWeight: 600,
                fontSize: 14,
                background: "white",
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
                background: "linear-gradient(135deg,#16a34a,#0ea5e9)",
              }}
            >
              Sign Up
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
