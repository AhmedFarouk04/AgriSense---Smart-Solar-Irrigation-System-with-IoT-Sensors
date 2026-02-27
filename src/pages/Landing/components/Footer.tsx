import { AgriSenseLogo } from "./Logo";

export function Footer() {
  const footerColumns = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Integrations", "Changelog"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Contact"],
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Security", "Cookies"],
    },
  ];

  return (
    <footer
      style={{
        background: "#0a0f0d",
        color: "white",
        padding: "64px 24px 32px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          className="footer-g"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 48,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <AgriSenseLogo size={42} />
              <div>
                <div
                  className="fd"
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    background: "linear-gradient(135deg,#4ade80,#38bdf8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  AgriSense
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
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
                color: "#6b7280",
                lineHeight: 1.7,
                maxWidth: 260,
              }}
            >
              AI-powered solar irrigation for sustainable, profitable farming.
              Built for the modern farmer.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    padding: "6px 14px",
                    background: "rgba(255,255,255,.06)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#9ca3af",
                    fontWeight: 500,
                    border: "1px solid rgba(255,255,255,.08)",
                    transition: "all .2s",
                  }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          {footerColumns.map((col, i) => (
            <div key={i}>
              <h4
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 16,
                  color: "#e5e7eb",
                  letterSpacing: ".02em",
                }}
              >
                {col.title}
              </h4>
              <ul style={{ listStyle: "none" }}>
                {col.links.map((link, j) => (
                  <li key={j} style={{ marginBottom: 10 }}>
                    <a
                      href="#"
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        transition: "color .2s",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLAnchorElement).style.color =
                          "#e5e7eb")
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLAnchorElement).style.color =
                          "#6b7280")
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
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,.07)",
            paddingTop: 24,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: "#4b5563" }}>
            © 2026 AgriSense. All rights reserved.
          </span>
          <span style={{ fontSize: 13, color: "#4b5563" }}>
            Made with 💚 for sustainable farming
          </span>
        </div>
      </div>
    </footer>
  );
}
