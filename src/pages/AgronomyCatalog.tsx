import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { ArrowLeft, Sprout, Filter, Download } from "lucide-react";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

type Tab = "fertilizer" | "cultivation";

const SHEET_LINKS = {
  fertilizer: "/agronomy/Detailed_Fertilizer_Schedule.xlsx",
  cultivation: encodeURI("/agronomy/جدول زراعة مفصل للخضروات والفواكه.xlsx"),
};

export default function AgronomyCatalog() {
  const fertilizerRows = useQuery(api.agronomy.getFertilizerSchedules, {});
  const cultivationRows = useQuery(api.agronomy.getCultivationGuides, {});
  const [scrolled, setScrolled] = useState(false);
  const [tab, setTab] = useState<Tab>("fertilizer");
  const [cropFilter, setCropFilter] = useState("all");

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const cropOptions = useMemo(() => {
    const set = new Set<string>();
    (fertilizerRows ?? []).forEach((r: any) => set.add(r.cropName));
    (cultivationRows ?? []).forEach((r: any) => set.add(r.cropName));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [fertilizerRows, cultivationRows]);

  const filteredFertilizer = useMemo(() => {
    const rows = fertilizerRows ?? [];
    if (cropFilter === "all") return rows;
    return rows.filter((r: any) => r.cropName === cropFilter);
  }, [fertilizerRows, cropFilter]);

  const filteredCultivation = useMemo(() => {
    const rows = cultivationRows ?? [];
    if (cropFilter === "all") return rows;
    return rows.filter((r: any) => r.cropName === cropFilter);
  }, [cultivationRows, cropFilter]);

  const loading = fertilizerRows === undefined || cultivationRows === undefined;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main-gradient)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <header
        className="header-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "var(--bg-nav)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
          transition: "all 0.3s ease",
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
            gap: 16,
          }}
        >
          <div
            className="header-left"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <button
              onClick={() => nav("/dashboard")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Sprout size={18} color="#4ade80" />
                Agronomy Catalog
              </div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                Full fertilizer and cultivation sheets
              </div>
            </div>
          </div>

          <div
            className="header-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <a
              className="nav-action-btn"
              href={SHEET_LINKS.fertilizer}
              download
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                color: "var(--text-primary)",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={13} />
              <span className="hide-on-mobile">
                Detailed_Fertilizer_Schedule
              </span>
            </a>
            <a
              className="nav-action-btn"
              href={SHEET_LINKS.cultivation}
              download
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                color: "var(--text-primary)",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={13} />
              <span className="hide-on-mobile">جدول زراعة مفصل</span>
            </a>
            <Filter
              className="hide-on-mobile"
              size={14}
              color="var(--text-faint)"
            />
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                color: "var(--text-primary)",
              }}
            >
              {cropOptions.map((crop) => (
                <option key={crop} value={crop}>
                  {crop === "all" ? "All crops" : crop}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              { id: "fertilizer", label: "Fertilizer Schedule" },
              { id: "cultivation", label: "Cultivation Guide" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border:
                  tab === t.id
                    ? "1px solid var(--brand-500)"
                    : "1px solid var(--border-card)",
                background: tab === t.id ? "var(--glass-bg)" : "transparent",
                color: tab === t.id ? "var(--brand-500)" : "var(--text-faint)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px", color: "var(--text-faint)" }}>
            Loading agronomy data...
          </div>
        ) : tab === "fertilizer" ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: 16,
              padding: "14px",
              overflowX: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "var(--text-faint)",
                  }}
                >
                  <th style={{ padding: "10px" }}>Crop</th>
                  <th style={{ padding: "10px" }}>Weeks</th>
                  <th style={{ padding: "10px" }}>Phase</th>
                  <th style={{ padding: "10px" }}>N</th>
                  <th style={{ padding: "10px" }}>P</th>
                  <th style={{ padding: "10px" }}>K</th>
                  <th style={{ padding: "10px" }}>Ca</th>
                  <th style={{ padding: "10px" }}>Mg</th>
                  <th style={{ padding: "10px" }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredFertilizer.map((row: any) => (
                  <tr
                    key={row._id}
                    style={{ borderTop: "1px solid var(--border-card)" }}
                  >
                    <td style={{ padding: "10px", fontWeight: 700 }}>
                      {row.cropName}
                    </td>
                    <td style={{ padding: "10px" }}>{row.weeksLabel}</td>
                    <td style={{ padding: "10px" }}>{row.applicationTiming}</td>
                    <td style={{ padding: "10px" }}>{row.nitrogenKgPerFed}</td>
                    <td style={{ padding: "10px" }}>
                      {row.phosphorusKgPerFed}
                    </td>
                    <td style={{ padding: "10px" }}>{row.potassiumKgPerFed}</td>
                    <td style={{ padding: "10px" }}>{row.calciumKgPerFed}</td>
                    <td style={{ padding: "10px" }}>{row.magnesiumKgPerFed}</td>
                    <td style={{ padding: "10px", minWidth: 260 }}>
                      {row.criticalRemarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: 16,
              padding: "14px",
              overflowX: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "var(--text-faint)",
                  }}
                >
                  <th style={{ padding: "10px" }}>Crop</th>
                  <th style={{ padding: "10px" }}>Best planting season</th>
                  <th style={{ padding: "10px" }}>Watering frequency</th>
                  <th style={{ padding: "10px" }}>Heavy watering phase</th>
                  <th style={{ padding: "10px" }}>Stressing period</th>
                  <th style={{ padding: "10px" }}>Harvest time</th>
                  <th style={{ padding: "10px" }}>Harvest signs</th>
                  <th style={{ padding: "10px" }}>Spacing (cm)</th>
                </tr>
              </thead>
              <tbody>
                {filteredCultivation.map((row: any) => (
                  <tr
                    key={row._id}
                    style={{ borderTop: "1px solid var(--border-card)" }}
                  >
                    <td style={{ padding: "10px", fontWeight: 700 }}>
                      {row.cropName}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {row.bestPlantingSeason}
                    </td>
                    <td style={{ padding: "10px" }}>{row.wateringFrequency}</td>
                    <td style={{ padding: "10px" }}>
                      {row.criticalHeavyWateringPhase}
                    </td>
                    <td style={{ padding: "10px" }}>{row.stressingPeriod}</td>
                    <td style={{ padding: "10px" }}>
                      {row.bestHarvestTimeWeeks}
                    </td>
                    <td style={{ padding: "10px", minWidth: 260 }}>
                      {row.harvestSigns}
                    </td>
                    <td style={{ padding: "10px" }}>{row.spacingCm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </main>
    </div>
  );
}
