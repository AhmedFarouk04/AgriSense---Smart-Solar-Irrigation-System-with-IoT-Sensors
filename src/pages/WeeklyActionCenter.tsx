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
import { Id } from "../../convex/_generated/dataModel";

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

  const latestReading = useQuery(
    api.readings.getLatestReading,
    selected?.deviceId
      ? { deviceId: selected.deviceId as Id<"devices"> }
      : "skip",
  );

  const deviceDetails = useQuery(
    api.devices.getDevice,
    selected?.deviceId
      ? { deviceId: selected.deviceId as Id<"devices"> }
      : "skip",
  );

  const processedTasks = useMemo(() => {
    if (!selected?.tasks) return [];
    return selected.tasks.map((task: any) => {
      let isCritical = false;
      let isResolved = false;
      let rec = task.recommendation;
      let status = task.status;

      const labelLower = task.label?.toLowerCase() || "";
      const textLower = labelLower + " " + (rec?.toLowerCase() || "");

      if (
        labelLower.includes("sensor") ||
        labelLower.includes("review") ||
        labelLower.includes("reading")
      ) {
        if (latestReading && deviceDetails) {
          const { moisture, temperature, flowRate, pumpStatus } = latestReading;
          const minMoist = deviceDetails.customMinMoisture ?? 30;
          const maxTemp = deviceDetails.customOptimalTemp
            ? deviceDetails.customOptimalTemp + 10
            : 38;

          if (
            moisture <= minMoist ||
            temperature >= maxTemp ||
            (pumpStatus && flowRate < 0.1)
          ) {
            isCritical = true;
            status = "pending";
            rec = `⚠️ Critical conditions detected! Moisture: ${moisture}%, Temp: ${temperature}°C, Flow: ${flowRate} L/min. Immediate review required.`;
          } else {
            rec =
              "Sensors operating within normal parameters. Readings are fresh.";
            status = "done";
          }
        }
      } else if (
        labelLower.includes("alert") ||
        labelLower.includes("follow-up") ||
        labelLower.includes("critical")
      ) {
        if (latestReading && deviceDetails) {
          const { moisture, temperature, flowRate, pumpStatus } = latestReading;
          const minMoist = deviceDetails.customMinMoisture ?? 30;
          const maxTemp = deviceDetails.customOptimalTemp
            ? deviceDetails.customOptimalTemp + 10
            : 38;

          const isLiveMoistureLow = moisture <= minMoist;
          const isLiveTempHigh = temperature >= maxTemp;
          const isLiveFlowLow = pumpStatus && flowRate < 0.1;

          let isSpecificAlertActive = false;
          let hasSpecificAlert = false;

          if (textLower.includes("tank empty") || textLower.includes("flow")) {
            hasSpecificAlert = true;
            isSpecificAlertActive =
              !!deviceDetails.isTankEmptySuspected ||
              !!deviceDetails.isFlowLow ||
              isLiveFlowLow;
          } else if (textLower.includes("temp") || textLower.includes("heat")) {
            hasSpecificAlert = true;
            isSpecificAlertActive =
              !!deviceDetails.isTempHigh || isLiveTempHigh;
          } else if (
            textLower.includes("moisture") ||
            textLower.includes("dry") ||
            textLower.includes("water")
          ) {
            hasSpecificAlert = true;
            isSpecificAlertActive =
              !!deviceDetails.isMoistureLow || isLiveMoistureLow;
          }

          const anyActive =
            !!deviceDetails.isTankEmptySuspected ||
            !!deviceDetails.isFlowLow ||
            !!deviceDetails.isTempHigh ||
            !!deviceDetails.isMoistureLow ||
            isLiveMoistureLow ||
            isLiveTempHigh ||
            isLiveFlowLow;

          if (!anyActive) {
            status = "done";
            if (hasSpecificAlert || task.status === "pending") {
              isResolved = true;
              rec =
                textLower.includes("flow") || textLower.includes("tank empty")
                  ? "Flow restored successfully. System operating normally."
                  : "Issue resolved successfully. System operating normally.";
            } else {
              rec = "No unresolved critical alerts. System operating normally.";
            }
          } else {
            isCritical = true;
            status = "pending";

            if (
              (hasSpecificAlert && !isSpecificAlertActive) ||
              textLower.includes("no unresolved")
            ) {
              const issues = [];
              if (isLiveMoistureLow || deviceDetails.isMoistureLow)
                issues.push("low moisture");
              if (
                isLiveFlowLow ||
                deviceDetails.isFlowLow ||
                deviceDetails.isTankEmptySuspected
              )
                issues.push("no water flow");
              if (isLiveTempHigh || deviceDetails.isTempHigh)
                issues.push("high temperature");

              rec = `Active critical condition detected: ${issues.join(" and ")}.`;
            }
          }
        }
      }

      return { ...task, isCritical, isResolved, status, rec };
    });
  }, [selected, latestReading, deviceDetails]);

  const frontendDoneCount = processedTasks.filter(
    (t: any) => t.status === "done",
  ).length;

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
              <div style={{ fontWeight: 800, fontSize: 17 }}>
                Weekly Action Center
              </div>
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
          <div style={{ textAlign: "center", padding: 80 }}>
            Loading weekly tasks...
          </div>
        ) : zones.length === 0 ? (
          <div style={{ textAlign: "center", padding: 90 }}>
            <Leaf
              size={36}
              style={{ margin: "0 auto 8px", color: "var(--text-faint)" }}
            />
            <div style={{ fontWeight: 700 }}>No zones available</div>
            <div
              style={{ color: "var(--text-faint)", fontSize: 13, marginTop: 6 }}
            >
              Add a zone first to generate weekly tasks.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gap: 16,
            }}
          >
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
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {zone.zoneName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-faint)",
                      marginTop: 2,
                    }}
                  >
                    {zone.cropName
                      ? `${zone.cropName} • Week ${zone.currentWeek}`
                      : "No crop selected"}
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
                    <div style={{ fontWeight: 800, fontSize: 18 }}>
                      {selected.zoneName}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                      {selected.cropName
                        ? `${selected.cropName} • Week ${selected.currentWeek}`
                        : "No crop selected"}
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
                    {frontendDoneCount}/{selected.totalTasks} checks passed
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {processedTasks.map((task: any) => {
                    const { isCritical, isResolved, status, rec } = task;

                    return (
                      <div
                        key={task.id}
                        style={{
                          border: isCritical
                            ? "1px solid var(--error-border)"
                            : "1px solid var(--border-base)",
                          borderRadius: 12,
                          padding: 12,
                          background: isCritical
                            ? "rgba(239, 68, 68, 0.05)"
                            : "var(--glass-bg)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {status === "done" ? (
                            <CheckCircle2
                              size={16}
                              color={statusColor(status)}
                            />
                          ) : (
                            <Circle
                              size={16}
                              color={
                                isCritical ? "#ef4444" : statusColor(status)
                              }
                            />
                          )}
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: isCritical
                                ? "#ef4444"
                                : "var(--text-primary)",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {task.label}
                            {isResolved && (
                              <span
                                style={{
                                  fontSize: 10,
                                  background: "rgba(74,222,128,0.15)",
                                  color: "#4ade80",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontWeight: 700,
                                }}
                              >
                                Resolved
                              </span>
                            )}
                          </div>
                          {status === "pending" && (
                            <AlertTriangle
                              size={14}
                              color={isCritical ? "#ef4444" : "#fbbf24"}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: isCritical ? "#ef4444" : "var(--text-muted)",
                          }}
                        >
                          {rec}
                        </div>
                        {task.dueAt && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 11,
                              color: "var(--text-faint)",
                            }}
                          >
                            Due: {new Date(task.dueAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
