import { AgriSenseLogo } from "./Logo";

interface FooterProps {
  isDark: boolean;
}

export function Footer({ isDark }: FooterProps) {
  const cols = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Integrations", "Changelog"],
    },
    { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
  ];

  return (
    <footer
      style={{
        background: "var(--footer-bg)",
        color: "white",
        padding: "72px 24px 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* top glow line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, var(--brand-600), transparent)",
          opacity: 0.5,
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
        {/* ✅ تم إزالة الـ inline grid واستخدام الكلاس للـ Responsive */}
        <div className="footer-grid" style={{ marginBottom: 56 }}>
          {/* ── Brand */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <AgriSenseLogo size={44} />
              <div>
                <div
                  className="fd"
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    background: "var(--grad-text)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  AgriSense
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Smart Solar Irrigation
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.42)",
                lineHeight: 1.75,
                maxWidth: 260,
                marginBottom: 20,
              }}
            >
              AI-powered solar irrigation for sustainable, profitable farming.
              Built for the modern farmer.
            </p>

            {/* contact */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginBottom: 20,
              }}
            >
              {[
                { icon: "✉", text: "hello@agrisense.io" },
                { icon: "📞", text: "+1 (555) 012-3456" },
                { icon: "📍", text: "San Francisco, CA" },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.38)",
                  }}
                >
                  <span style={{ fontSize: 11 }}>{c.icon}</span> {c.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    padding: "6px 14px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.45)",
                    fontWeight: 500,
                    border: "1px solid rgba(255,255,255,0.08)",
                    transition: "all .2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLElement).style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color =
                      "rgba(255,255,255,0.45)";
                  }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* ── Link columns */}
          {cols.map((col, i) => (
            <div key={i}>
              <h4
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  marginBottom: 18,
                  color: "rgba(255,255,255,0.75)",
                  letterSpacing: ".05em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {col.title}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map((link, j) => (
                  <li key={j} style={{ marginBottom: 11 }}>
                    <a
                      href="#"
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.38)",
                        fontWeight: 500,
                        transition: "color .2s",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLElement).style.color =
                          "rgba(255,255,255,0.85)")
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.color =
                          "rgba(255,255,255,0.38)")
                      }
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar */}
        {/* ✅ استخدام الكلاس للـ Responsive */}
        <div
          className="footer-bottom"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 24,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
            © 2026 AgriSense. All rights reserved.
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
            Made with 💚 for sustainable farming
          </span>
        </div>
      </div>
    </footer>
  );
}
