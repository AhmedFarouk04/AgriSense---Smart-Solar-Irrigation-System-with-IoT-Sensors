import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Sun,
  Droplets,
  Waves,
  ChevronRight,
  Leaf,
  ArrowRight,
} from "lucide-react";
import { AgriSenseLogo } from "./components/Logo";
import { Counter } from "./components/Counter";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import "./styles.css";

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "32%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const features = [
    {
      icon: <Sun className="w-6 h-6" />,
      title: "Solar Powered",
      desc: "100% renewable energy — zero electricity costs, fully self-sustaining from day one.",
      accent: "#f59e0b",
      bg: "rgba(245,158,11,0.07)",
      border: "rgba(245,158,11,0.22)",
    },
    {
      icon: <Droplets className="w-6 h-6" />,
      title: "Smart Irrigation",
      desc: "AI-calibrated watering schedules based on live soil readings and local weather data.",
      accent: "#0ea5e9",
      bg: "rgba(14,165,233,0.07)",
      border: "rgba(14,165,233,0.22)",
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: "Crop Library",
      desc: "Pre-configured growth profiles for 20+ crops, ready to deploy in seconds.",
      accent: "#16a34a",
      bg: "rgba(22,163,74,0.07)",
      border: "rgba(22,163,74,0.22)",
    },
    {
      icon: <Waves className="w-6 h-6" />,
      title: "Soil Sensors",
      desc: "Real-time monitoring of moisture, salinity & temperature right at root depth.",
      accent: "#0d9488",
      bg: "rgba(13,148,136,0.07)",
      border: "rgba(13,148,136,0.22)",
    },
  ];

  const steps = [
    {
      n: "01",
      title: "Register",
      desc: "Create your farmer profile in under 2 minutes.",
    },
    {
      n: "02",
      title: "Connect Device",
      desc: "Link your sensor using a unique Device ID.",
    },
    {
      n: "03",
      title: "Select Crop",
      desc: "Pick your plant from our smart crop library.",
    },
    {
      n: "04",
      title: "Go Live",
      desc: "Real-time data, smart alerts & AI insights.",
    },
  ];

  const stats = [
    { end: 10, suffix: "K+", label: "Farmers" },
    { end: 50, suffix: "K+", label: "Acres Managed" },
    { end: 30, suffix: "%", label: "Water Saved" },
    { end: 24, suffix: "/7", label: "Monitoring" },
  ];

  return (
    <>
      <div style={{ minHeight: "100vh", background: "#f7fdf3" }}>
        <Navbar scrolled={scrolled} />

        {/* Hero Section */}
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
            background:
              "radial-gradient(ellipse 90% 70% at 50% -10%,#dcfce7 0%,#f0fdf4 35%,#f7fdf3 65%)",
          }}
        >
          {/* Blobs */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <div
              className="blob"
              style={{
                position: "absolute",
                width: 560,
                height: 560,
                top: -100,
                left: -120,
                background:
                  "radial-gradient(circle,rgba(134,239,172,.28) 0%,transparent 70%)",
              }}
            />
            <div
              className="blob2"
              style={{
                position: "absolute",
                width: 420,
                height: 420,
                top: 80,
                right: -100,
                background:
                  "radial-gradient(circle,rgba(147,210,255,.25) 0%,transparent 70%)",
              }}
            />
            <div
              className="blob3"
              style={{
                position: "absolute",
                width: 380,
                height: 380,
                bottom: -60,
                left: "35%",
                background:
                  "radial-gradient(circle,rgba(52,211,153,.2) 0%,transparent 70%)",
              }}
            />
            {/* Decorative rings */}
            <div
              style={{
                position: "absolute",
                width: 660,
                height: 660,
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-58%)",
                border: "1px dashed rgba(22,163,74,.11)",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 920,
                height: 920,
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-58%)",
                border: "1px dashed rgba(14,165,233,.08)",
                borderRadius: "50%",
              }}
            />
            {/* Floating dots */}
            {[
              [14, 28],
              [82, 18],
              [7, 72],
              [90, 66],
              [50, 88],
            ].map(([x, y], i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0], opacity: [0.35, 0.75, 0.35] }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  delay: i * 0.7,
                }}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  width: i % 2 === 0 ? 8 : 5,
                  height: i % 2 === 0 ? 8 : 5,
                  borderRadius: "50%",
                  background:
                    i % 3 === 0
                      ? "#16a34a"
                      : i % 3 === 1
                        ? "#0ea5e9"
                        : "#f59e0b",
                  opacity: 0.35,
                }}
              />
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
              transition={{ delay: 0.1 }}
              style={{ marginBottom: 34 }}
            >
              <span className="badge">
                <span className="bdot" />
                AI-Powered Crop Intelligence — Now Live
              </span>
            </motion.div>

            {/* Big Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 1.1, type: "spring", stiffness: 100 }}
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 30,
              }}
            >
              <div
                className="float"
                style={{
                  filter:
                    "drop-shadow(0 20px 48px rgba(22,163,74,.32)) drop-shadow(0 4px 12px rgba(14,165,233,.18))",
                }}
              >
                <AgriSenseLogo size={112} />
              </div>
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.22, duration: 0.85 }}
              className="fd"
              style={{
                fontSize: "clamp(44px,8vw,88px)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                marginBottom: 22,
              }}
            >
              <span className="grad">Smart Solar</span>
              <br />
              <span style={{ color: "#0f172a" }}>Irrigation System</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.34 }}
              style={{
                fontSize: "clamp(16px,2vw,20px)",
                color: "#4b5563",
                lineHeight: 1.75,
                maxWidth: 600,
                margin: "0 auto 44px",
              }}
            >
              Monitor and control your farm from anywhere. Get AI-powered
              recommendations based on real soil data and crop requirements.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.44 }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                justifyContent: "center",
                marginBottom: 68,
              }}
            >
              <motion.a
                href="/register"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 56px rgba(22,163,74,.42)",
                }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "15px 38px",
                  background: "linear-gradient(135deg,#16a34a 0%,#0ea5e9 100%)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 17,
                  borderRadius: 16,
                  boxShadow: "0 8px 32px rgba(22,163,74,.38)",
                }}
              >
                Get Started Free <ChevronRight size={20} />
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.03 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "15px 38px",
                  background: "white",
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: 17,
                  borderRadius: 16,
                  border: "1.5px solid #e5e7eb",
                  boxShadow: "0 4px 16px rgba(0,0,0,.06)",
                }}
              >
                See How It Works
              </motion.a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="stats-g"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 16,
                maxWidth: 780,
                margin: "0 auto",
              }}
            >
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  style={{
                    textAlign: "center",
                    padding: "20px 12px",
                    background: "rgba(255,255,255,.75)",
                    backdropFilter: "blur(12px)",
                    borderRadius: 16,
                    border: "1px solid rgba(22,163,74,.1)",
                    boxShadow: "0 4px 16px rgba(0,0,0,.04)",
                    transition: "box-shadow .3s",
                  }}
                >
                  <div
                    className="fd grad"
                    style={{
                      fontSize: "clamp(26px,3.5vw,38px)",
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    <Counter end={s.end} suffix={s.suffix} />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      fontWeight: 500,
                      marginTop: 6,
                      letterSpacing: ".02em",
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
            transition={{ delay: 1.4 }}
            style={{
              position: "absolute",
              bottom: 32,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              color: "#9ca3af",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            <span>Scroll</span>
            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              style={{
                width: 1,
                height: 36,
                background: "linear-gradient(180deg,#16a34a,transparent)",
              }}
            />
          </motion.div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          style={{ padding: "108px 24px", background: "white" }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              style={{ textAlign: "center", marginBottom: 72 }}
            >
              <span
                className="badge"
                style={{ marginBottom: 20, display: "inline-flex" }}
              >
                Core Features
              </span>
              <h2
                className="fd"
                style={{
                  fontSize: "clamp(32px,5vw,56px)",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  marginBottom: 16,
                }}
              >
                Why Choose AgriSense?
              </h2>
              <p
                style={{
                  fontSize: 18,
                  color: "#6b7280",
                  maxWidth: 520,
                  margin: "0 auto",
                }}
              >
                Everything you need to run a smarter, greener farm — all in one
                platform.
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
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8 }}
                  className="shine"
                  style={{
                    padding: 28,
                    background: f.bg,
                    border: `1.5px solid ${f.border}`,
                    borderRadius: 24,
                    boxShadow: "0 4px 20px rgba(0,0,0,.04)",
                    transition: "box-shadow .3s,transform .3s",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: f.accent + "22",
                      border: `1.5px solid ${f.accent}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: f.accent,
                      marginBottom: 18,
                      boxShadow: `0 4px 16px ${f.accent}22`,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: 10,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.7 }}
                  >
                    {f.desc}
                  </p>
                  <div
                    style={{
                      marginTop: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: f.accent,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Learn more <ArrowRight size={14} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          style={{
            padding: "108px 24px",
            background:
              "linear-gradient(180deg,#f7fdf3 0%,#f0fdf4 50%,#f7fdf3 100%)",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginBottom: 72 }}
            >
              <span
                className="badge"
                style={{ marginBottom: 20, display: "inline-flex" }}
              >
                Simple Process
              </span>
              <h2
                className="fd"
                style={{
                  fontSize: "clamp(32px,5vw,56px)",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  marginBottom: 16,
                }}
              >
                How It Works
              </h2>
              <p
                style={{
                  fontSize: 18,
                  color: "#6b7280",
                  maxWidth: 460,
                  margin: "0 auto",
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
              {/* Connector line */}
              <div
                className="hide-mob"
                style={{
                  position: "absolute",
                  top: 28,
                  left: "calc(12.5%)",
                  right: "calc(12.5%)",
                  height: 2,
                  background:
                    "linear-gradient(90deg,rgba(22,163,74,.25),rgba(14,165,233,.25))",
                  zIndex: 0,
                }}
              />
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  style={{
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      background:
                        "linear-gradient(135deg,#16a34a 0%,#0ea5e9 100%)",
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      boxShadow: "0 8px 28px rgba(22,163,74,.3)",
                      fontFamily: "'Fraunces',Georgia,serif",
                      fontSize: 20,
                      fontWeight: 900,
                      color: "white",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.n}
                  </div>
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: 8,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}
                  >
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          style={{
            padding: "100px 24px",
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg,#14532d 0%,#15803d 40%,#0369a1 100%)",
          }}
        >
          {/* Background texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 500,
              height: 500,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              background:
                "radial-gradient(circle,rgba(255,255,255,.07) 0%,transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              maxWidth: 800,
              margin: "0 auto",
              textAlign: "center",
              color: "white",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  filter: "drop-shadow(0 0 32px rgba(255,255,255,.25))",
                }}
              >
                <AgriSenseLogo size={72} />
              </div>
            </div>
            <h2
              className="fd"
              style={{
                fontSize: "clamp(32px,5vw,56px)",
                fontWeight: 900,
                marginBottom: 16,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Ready to Transform Your Farm?
            </h2>
            <p
              style={{
                fontSize: 18,
                marginBottom: 40,
                opacity: 0.85,
                lineHeight: 1.7,
              }}
            >
              Join thousands of farmers already saving water and growing smarter
              with AgriSense.
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
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 50px rgba(0,0,0,.3)",
                }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "15px 38px",
                  background: "white",
                  color: "#15803d",
                  fontWeight: 800,
                  fontSize: 17,
                  borderRadius: 16,
                  boxShadow: "0 8px 32px rgba(0,0,0,.2)",
                }}
              >
                Start Free Trial
              </motion.a>
              <motion.a
                href="#features"
                whileHover={{ scale: 1.03 }}
                style={{
                  padding: "15px 38px",
                  background: "rgba(255,255,255,.12)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 17,
                  borderRadius: 16,
                  border: "1.5px solid rgba(255,255,255,.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Explore Features
              </motion.a>
            </div>
          </motion.div>
        </section>

        <Footer />
      </div>
    </>
  );
}
