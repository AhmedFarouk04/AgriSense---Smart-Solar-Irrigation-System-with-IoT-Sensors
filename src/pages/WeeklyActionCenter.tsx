import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ListChecks,
  Leaf,
  AlertTriangle,
} from "lucide-react";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

function statusColor(status: string) {
  return status === "done" ? "#4ade80" : "#fbbf24";
}

export default function WeeklyActionCenter() {
  const zones = useQuery(api.weeklyActions.getWeeklyActionCenter);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!zones || zones.length === 0) return null;
    if (!selectedZoneId) return zones[0];
    return zones.find((z: any) => z.deviceId === selectedZoneId) ?? zones[0];
  }, [zones, selectedZoneId]);

  return (
    <div style={{ minHeight: "100vh", color: "var(--text-primary)" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(20px)",
          background: "var(--bg-nav)",
          borderBottom: "1px solid var(--border-base)",
          padding: "12px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => nav("/dashboard")}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid var(--border-card)",
                background: "var(--glass-bg)",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Weekly Action Center</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                Planned irrigation, fertilization and checks for each zone
              </div>
            </div>
          </div>
          <ListChecks size={18} color="#4ade80" />
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        {zones === undefined ? (
          <div style={{ textAlign: "center", padding: 80 }}>Loading weekly tasks...</div>
        ) : zones.length === 0 ? (
          <div style={{ textAlign: "center", padding: 90 }}>
            <Leaf size={36} style={{ margin: "0 auto 8px", color: "var(--text-faint)" }} />
            <div style={{ fontWeight: 700 }}>No zones available</div>
            <div style={{ color: "var(--text-faint)", fontSize: 13, marginTop: 6 }}>
              Add a zone first to generate weekly tasks.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                borderRadius: 16,
                padding: 12,
                height: "fit-content",
              }}
            >
              {zones.map((zone: any) => (
                <button
                  key={zone.deviceId}
                  onClick={() => setSelectedZoneId(zone.deviceId)}
                  style={{
                    width: "100%",
                    marginBottom: 8,
                    borderRadius: 12,
                    border:
                      selected?.deviceId === zone.deviceId
                        ? "1px solid #4ade80"
                        : "1px solid var(--border-base)",
                    background:
                      selected?.deviceId === zone.deviceId
                        ? "rgba(74,222,128,0.12)"
                        : "transparent",
                    padding: "10px 12px",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{zone.zoneName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                    {zone.cropName ? `${zone.cropName} • Week ${zone.currentWeek}` : "No crop selected"}
                  </div>
                  <div style={{ fontSize: 11, color: "#4ade80", marginTop: 4 }}>
                    {zone.completionPercent}% complete
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{selected.zoneName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                      {selected.cropName ? `${selected.cropName} • Week ${selected.currentWeek}` : "No crop selected"}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(74,222,128,0.12)",
                      border: "1px solid rgba(74,222,128,0.25)",
                      color: "#4ade80",
                      fontWeight: 700,
                    }}
                  >
                    {selected.doneCount}/{selected.totalTasks} done
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {selected.tasks.map((task: any) => (
                    <div
                      key={task.id}
                      style={{
                        border: "1px solid var(--border-base)",
                        borderRadius: 12,
                        padding: 12,
                        background: "var(--glass-bg)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {task.status === "done" ? (
                          <CheckCircle2 size={16} color={statusColor(task.status)} />
                        ) : (
                          <Circle size={16} color={statusColor(task.status)} />
                        )}
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{task.label}</div>
                        {task.status === "pending" && (
                          <AlertTriangle size={14} color="#fbbf24" />
                        )}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>
                        {task.recommendation}
                      </div>
                      {task.dueAt && (
                        <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-faint)" }}>
                          Due: {new Date(task.dueAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 900px) {
          main > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

