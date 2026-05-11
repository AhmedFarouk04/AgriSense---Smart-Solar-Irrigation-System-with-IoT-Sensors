import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

function getWeekStartTimestamp(now = Date.now()) {
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

function estimateIrrigationIntervalMs(wateringFrequency?: string | null) {
  if (!wateringFrequency) return null;
  const value = wateringFrequency.toLowerCase().trim();
  if (value.includes("daily")) return 24 * 60 * 60 * 1000;

  const everyRange = value.match(/every\s+(\d+)\s*-\s*(\d+)\s*days?/i);
  if (everyRange) {
    const low = Number(everyRange[1]);
    const high = Number(everyRange[2]);
    if (Number.isFinite(low) && Number.isFinite(high) && high >= low) {
      return ((low + high) / 2) * 24 * 60 * 60 * 1000;
    }
  }

  const everySingle = value.match(/every\s+(\d+)\s*days?/i);
  if (everySingle) {
    const days = Number(everySingle[1]);
    if (Number.isFinite(days)) return days * 24 * 60 * 60 * 1000;
  }
  return null;
}

export const getWeeklyActionCenter = query({
  args: {},
  handler: async (ctx): Promise<any[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const viewedAt = settings?.lastNotificationsViewedAt ?? 0;
    const now = Date.now();
    const weekStart = getWeekStartTimestamp(now);

    const results = await Promise.all(
      devices.map(async (device) => {
        const [plan, latestReading] = await Promise.all([
          ctx.runQuery(internal.agronomy.getDevicePlanInternal, { deviceId: device._id }),
          ctx.runQuery(internal.readings.getLatestReadingInternal, { deviceId: device._id }),
        ]);

        const events = await ctx.db
          .query("events")
          .withIndex("by_device", (q) => q.eq("deviceId", device._id))
          .order("desc")
          .take(120);

        const latestIrrigationStart = events.find((e) => e.type === "irrigation_started");
        const latestFertilizationStart = events.find(
          (e) => e.type === "fertilization_started",
        );
        const unresolvedCritical = events.find(
          (e) =>
            e.timestamp > viewedAt &&
            ["alert", "tank_empty_suspected", "critical_escalation", "fertilization_safety_stop"].includes(e.type),
        );

        const irrigationInterval = estimateIrrigationIntervalMs(
          plan?.cultivationGuide?.wateringFrequency ?? null,
        );
        const lastIrrigationAt = latestIrrigationStart?.timestamp ?? null;
        const nextIrrigationAt =
          irrigationInterval && lastIrrigationAt
            ? lastIrrigationAt + irrigationInterval
            : null;
        const irrigationDoneThisWeek =
          !!latestIrrigationStart && latestIrrigationStart.timestamp >= weekStart;

        const fertilizationDoneThisWeek =
          !!latestFertilizationStart && latestFertilizationStart.timestamp >= weekStart;

        const sensorReviewDone =
          !!latestReading && now - latestReading.timestamp <= 2 * 60 * 60 * 1000;

        const tasks = [
          {
            id: "irrigation",
            label: "Irrigation cycle",
            status: irrigationDoneThisWeek ? "done" : "pending",
            dueAt: nextIrrigationAt,
            recommendation:
              plan?.cultivationGuide?.wateringFrequency ??
              "Define crop watering cadence",
          },
          {
            id: "fertilization",
            label: "Fertilization cycle",
            status: fertilizationDoneThisWeek ? "done" : "pending",
            dueAt: null,
            recommendation:
              plan?.nutrientSummary ??
              "Select crop and area to enable fertilizer recommendation",
          },
          {
            id: "sensor_review",
            label: "Sensor review",
            status: sensorReviewDone ? "done" : "pending",
            dueAt: null,
            recommendation: sensorReviewDone
              ? "Readings are fresh"
              : "Fetch new readings and verify sensor connectivity",
          },
          {
            id: "critical_followup",
            label: "Critical alert follow-up",
            status: unresolvedCritical ? "pending" : "done",
            dueAt: unresolvedCritical?.timestamp ?? null,
            recommendation: unresolvedCritical
              ? unresolvedCritical.message
              : "No unresolved critical alerts",
          },
        ];

        const doneCount = tasks.filter((t) => t.status === "done").length;
        return {
          deviceId: device._id,
          zoneName: device.name,
          cropName: plan?.cropName ?? null,
          currentWeek: plan?.currentWeek ?? null,
          tasks,
          doneCount,
          totalTasks: tasks.length,
          completionPercent: Math.round((doneCount / tasks.length) * 100),
        };
      }),
    );

    return results;
  },
});
