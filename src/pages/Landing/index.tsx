import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Sun,
  Droplets,
  Waves,
  Leaf,
  ArrowRight,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { AgriSenseLogo } from "./components/Logo";
import { Counter } from "./components/Counter";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import "./styles.css";

const FEATURES = [
  {
    icon: <Sun size={22} />,
    title: "Solar Powered",
    desc: "100% renewable energy — zero electricity costs. Self-sustaining from day one with smart power management.",
    accent: "#fbbf24",
    bg: "rgba(251,191,36,0.07)",
    border: "rgba(251,191,36,0.18)",
    tag: "Energy",
  },
  {
    icon: <Droplets size={22} />,
    title: "Smart Irrigation",
    desc: "AI-calibrated watering schedules driven by live soil readings, crop profiles & local weather data.",
    accent: "#38bdf8",
    bg: "rgba(56,189,248,0.07)",
    border: "rgba(56,189,248,0.18)",
    tag: "AI",
  },
  {
    icon: <Leaf size={22} />,
    title: "Crop Library",
    desc: "Pre-configured growth profiles for 20+ crops — deploy in seconds, harvest with confidence.",
    accent: "#4ade80",
    bg: "rgba(74,222,128,0.07)",
    border: "rgba(74,222,128,0.18)",
    tag: "Library",
  },
  {
    icon: <Waves size={22} />,
    title: "Soil Sensors",
    desc: "Real-time moisture, salinity & temperature monitoring right at root depth, 24/7.",
    accent: "#34d399",
    bg: "rgba(52,211,153,0.07)",
    border: "rgba(52,211,153,0.18)",
    tag: "Hardware",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Register",
    desc: "Create your farmer profile in under 2 minutes — no credit card needed.",
  },
  {
    n: "02",
    title: "Connect Device",
    desc: "Link your sensor via a unique Device ID. Plug-and-play setup.",
  },
  {
    n: "03",
    title: "Select Crop",
    desc: "Pick your plant from our smart crop library. AI configures the rest.",
  },
  {
    n: "04",
    title: "Go Live",
    desc: "Real-time dashboards, smart alerts & AI recommendations, instantly.",
  },
];

const STATS = [
  { end: 10, suffix: "K+", label: "Farmers", icon: <TrendingUp size={16} /> },
  { end: 50, suffix: "K+", label: "Acres Managed", icon: <Shield size={16} /> },
  { end: 30, suffix: "%", label: "Water Saved", icon: <Droplets size={16} /> },
  { end: 24, suffix: "/7", label: "Monitoring", icon: <Zap size={16} /> },
];

const TESTIMONIALS = [
  {
    name: "Amara Diallo",
    role: "Wheat Farmer · Senegal",
    text: "AgriSense cut our water usage by 35% in the first season. The AI recommendations are eerily accurate.",
    avatar: "AD",
  },
  {
    name: "Carlos Mendoza",
    role: "Vineyard Owner · Chile",
    text: "Setup took 20 minutes. Now I manage 200 acres from my phone. Incredible product.",
    avatar: "CM",
  },
  {
    name: "Priya Nair",
    role: "Rice Farmer · India",
    text: "The soil sensor data helped us prevent a fungal outbreak. ROI paid back in 6 weeks.",
    avatar: "PN",
  },
];

function Particle({
  x,
  y,
  size,
  color,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, -18, 0], opacity: [0.25, 0.7, 0.25] }}
      transition={{ duration: 5 + delay, repeat: Infinity, delay }}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        pointerEvents: "none",
      }}
    />
  );
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const isDark = false;

  const PARTICLES = [
    { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
    { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
    { x: 6, y: 70, size: 6, color: "var(--particle-3)", delay: 1.5 },
    { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
    { x: 50, y: 90, size: 5, color: "var(--particle-2)", delay: 2 },
    { x: 20, y: 85, size: 4, color: "var(--particle-1)", delay: 1.2 },
    { x: 75, y: 40, size: 6, color: "var(--particle-3)", delay: 1.8 },
  ];

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh" }}>
      <Navbar scrolled={scrolled} isDark={isDark} />

      {}
      <section
        ref={heroRef}
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          paddingTop: 96,
          background: "var(--grad-hero)",
        }}
      >
        {/* Background */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div
            className="blob"
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              top: -160,
              left: -160,
              background: `radial-gradient(circle, var(--blob-1) 0%, transparent 70%)`,
            }}
          />
          <div
            className="blob2"
            style={{
              position: "absolute",
              width: 500,
              height: 500,
              top: 60,
              right: -120,
              background: `radial-gradient(circle, var(--blob-2) 0%, transparent 70%)`,
            }}
          />
          <div
            className="blob3"
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              bottom: -80,
              left: "30%",
              background: `radial-gradient(circle, var(--blob-3) 0%, transparent 70%)`,
            }}
          />

          <div
            className="grid-pattern"
            style={{ position: "absolute", inset: 0, opacity: 0.6 }}
          />

          {[640, 900, 1160].map((d, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: d,
                height: d,
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-60%)",
                border: `1px ${i === 0 ? "solid" : "dashed"} var(--border-base)`,
                borderRadius: "50%",
              }}
            />
          ))}

          {PARTICLES.map((p, i) => (
            <Particle key={i} {...p} />
          ))}
        </div>

        <motion.div
          style={{
            y: heroY,
            opacity: heroOpacity,
            position: "relative",
            zIndex: 10,
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            style={{ marginBottom: 36 }}
          >
            <span className="badge">
              <span className="bdot" />
              <Sparkles size={11} style={{ opacity: 0.7 }} />
              AI-Powered Crop Intelligence — Now Live
            </span>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              duration: 1.1,
              type: "spring",
              stiffness: 90,
              delay: 0.05,
            }}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 36,
            }}
          >
            <div
              className="float"
              style={{
                filter:
                  "drop-shadow(0 24px 60px rgba(74,222,128,0.35)) drop-shadow(0 6px 16px rgba(56,189,248,0.20))",
              }}
            >
              <AgriSenseLogo size={116} />
            </div>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ y: 36, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="fd"
            style={{
              fontSize: "clamp(46px, 8.5vw, 96px)",
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              marginBottom: 24,
              color: "var(--text-primary)",
            }}
          >
            <span className="grad-text">Smart Solar</span>
            <br />
            <span>Irrigation</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.34, duration: 0.7 }}
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              color: "var(--text-muted)",
              lineHeight: 1.8,
              maxWidth: 560,
              margin: "0 auto 48px",
            }}
          >
            Monitor and control your farm from anywhere. Get AI-powered
            recommendations based on real soil data and crop requirements.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.44, duration: 0.7 }}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "center",
              marginBottom: 72,
            }}
          >
            <motion.a
              href="/register"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
            >
              Get Started Free <ChevronRight size={18} />
            </motion.a>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.03 }}
              className="btn-secondary"
            >
              See How It Works
            </motion.a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ y: 36, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.56, duration: 0.8 }}
            className="stats-g"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            {STATS.map((s, i) => (
              <motion.div key={i} whileHover={{ y: -5 }} className="stat-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 8,
                    color: "var(--brand-500)",
                    opacity: 0.7,
                  }}
                >
                  {s.icon}
                </div>
                <div
                  className="fd grad-text"
                  style={{
                    fontSize: "clamp(28px,3.5vw,40px)",
                    fontWeight: 900,
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  <Counter end={s.end} suffix={s.suffix} />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          style={{
            position: "absolute",
            bottom: 36,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            color: "var(--text-faint)",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span>Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            style={{
              width: 1,
              height: 40,
              background:
                "linear-gradient(180deg, var(--brand-500), transparent)",
            }}
          />
        </motion.div>
      </section>

      {/* ══════════════════════════
          FEATURES
      ══════════════════════════ */}
      <section
        id="features"
        style={{
          padding: "120px 24px",
          position: "relative",
          background: "var(--grad-section)",
          overflow: "hidden",
        }}
      >
        <div className="divider" style={{ maxWidth: 900, marginBottom: 100 }} />
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 72 }}
          >
            <h2
              className="fd"
              style={{
                fontSize: "clamp(32px,5vw,58px)",
                fontWeight: 900,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
                marginBottom: 16,
              }}
            >
              Why Choose <span className="grad-text">AgriSense?</span>
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "var(--text-muted)",
                maxWidth: 500,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Everything you need to run a smarter, greener farm — all in one
              intelligent platform.
            </p>
          </motion.div>

          <div
            className="feat-g"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 20,
            }}
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.65 }}
                whileHover={{ y: -10 }}
                className="shine glass-card"
                style={{
                  padding: "30px 26px",
                  background: f.bg,
                  border: `1px solid ${f.border}`,
                  borderRadius: 24,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    marginBottom: 20,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: f.accent + "1A",
                      border: `1px solid ${f.accent}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: f.accent,
                      boxShadow: `0 4px 20px ${f.accent}22`,
                    }}
                  >
                    {f.icon}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: f.accent,
                      opacity: 0.7,
                      padding: "3px 8px",
                      background: f.accent + "14",
                      borderRadius: 99,
                      border: `1px solid ${f.accent}22`,
                    }}
                  >
                    {f.tag}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 10,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-muted)",
                    lineHeight: 1.75,
                  }}
                >
                  {f.desc}
                </p>
                <div
                  style={{
                    marginTop: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: f.accent,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Learn more <ArrowRight size={13} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          HOW IT WORKS
      ══════════════════════════ */}
      <section
        id="how-it-works"
        style={{
          padding: "120px 24px",
          position: "relative",
          background: "var(--bg-soft)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background:
              "radial-gradient(circle, var(--blob-1) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 80 }}
          >
            <h2
              className="fd"
              style={{
                fontSize: "clamp(32px,5vw,58px)",
                fontWeight: 900,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
                marginBottom: 16,
              }}
            >
              How It <span className="grad-text">Works</span>
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "var(--text-muted)",
                maxWidth: 440,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              From setup to full monitoring in minutes — not days.
            </p>
          </motion.div>

          <div
            className="step-g"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 24,
              position: "relative",
            }}
          >
            <div
              className="hide-mob"
              style={{
                position: "absolute",
                top: 26,
                left: "calc(12.5%)",
                right: "calc(12.5%)",
                height: 1,
                background:
                  "linear-gradient(90deg, var(--divider-1), var(--divider-2))",
                zIndex: 0,
              }}
            />
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.65 }}
                whileHover={{ y: -6 }}
                style={{
                  textAlign: "center",
                  position: "relative",
                  zIndex: 1,
                  padding: "32px 20px",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--border-card)",
                  borderRadius: 20,
                  transition: "all 0.35s ease",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="step-num" style={{ margin: "0 auto 24px" }}>
                  {s.n}
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 10,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          CTA SECTION
      ══════════════════════════ */}
      <section
        style={{
          padding: "120px 24px",
          position: "relative",
          overflow: "hidden",
          background: "var(--footer-bg)",
        }}
      >
        <div
          className="dot-pattern"
          style={{ position: "absolute", inset: 0, opacity: 0.5 }}
        />
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            top: "50%",
            left: "30%",
            transform: "translate(-50%,-50%)",
            background:
              "radial-gradient(circle, var(--blob-1) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: 780,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, type: "spring" }}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <div
              className="float-slow"
              style={{ filter: "drop-shadow(0 0 40px rgba(74,222,128,0.30))" }}
            >
              <AgriSenseLogo size={80} />
            </div>
          </motion.div>

          <h2
            className="fd"
            style={{
              fontSize: "clamp(32px,5.5vw,60px)",
              fontWeight: 900,
              marginBottom: 20,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: "white",
            }}
          >
            Ready to Transform
            <br />
            <span className="grad-text">Your Farm?</span>
          </h2>
          <p
            style={{
              fontSize: 18,
              marginBottom: 48,
              color: "rgba(255,255,255,0.50)",
              lineHeight: 1.75,
              maxWidth: 520,
              margin: "0 auto 48px",
            }}
          >
            Join thousands of farmers already saving water and growing smarter
            with AgriSense. No contract, cancel anytime.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "center",
            }}
          >
            <motion.a
              href="/register"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              style={{ fontSize: 17, padding: "16px 40px" }}
            >
              Start Free Trial <ChevronRight size={20} />
            </motion.a>
            <motion.a
              href="#features"
              whileHover={{ scale: 1.03 }}
              style={{
                fontSize: 17,
                padding: "16px 40px",
                background: "rgba(255,255,255,0.10)",
                color: "white",
                fontWeight: 600,
                borderRadius: "var(--r-lg)",
                border: "1.5px solid rgba(255,255,255,0.20)",
                backdropFilter: "blur(8px)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Explore Features
            </motion.a>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 24,
              marginTop: 48,
            }}
          >
            {[""].map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "rgba(255,255,255,0.40)",
                  fontSize: 13,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <Footer isDark={isDark} />
    </div>
  );
}
