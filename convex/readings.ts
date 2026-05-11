import {
  query,
  action,
  mutation,
  internalMutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const FEDDAN_M2 = 4200;

function formatUtcTimestamp(ts: number) {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 16) + " UTC";
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
      const avgDays = (low + high) / 2;
      return avgDays * 24 * 60 * 60 * 1000;
    }
  }

  const everySingle = value.match(/every\s+(\d+)\s*days?/i);
  if (everySingle) {
    const days = Number(everySingle[1]);
    if (Number.isFinite(days)) return days * 24 * 60 * 60 * 1000;
  }

  if (value.includes("mist") || value.includes("heavy")) {
    return 24 * 60 * 60 * 1000;
  }

  return null;
}

function buildNutrientKgPerFed(phase: any) {
  if (!phase) return null;
  return {
    nitrogen: phase.nitrogenKgPerFed,
    phosphorus: phase.phosphorusKgPerFed,
    potassium: phase.potassiumKgPerFed,
    calcium: phase.calciumKgPerFed,
    magnesium: phase.magnesiumKgPerFed,
  };
}

function buildZoneDoseKg(phase: any, areaM2?: number) {
  if (!phase || !areaM2 || areaM2 <= 0) return null;
  const factor = areaM2 / FEDDAN_M2;
  return {
    nitrogen: Number((phase.nitrogenKgPerFed * factor).toFixed(2)),
    phosphorus: Number((phase.phosphorusKgPerFed * factor).toFixed(2)),
    potassium: Number((phase.potassiumKgPerFed * factor).toFixed(2)),
    calcium: Number((phase.calciumKgPerFed * factor).toFixed(2)),
    magnesium: Number((phase.magnesiumKgPerFed * factor).toFixed(2)),
  };
}

async function writeControlState(
  url: string,
  secret: string,
  state: boolean,
) {
  const payload = JSON.stringify(state ? 1 : 0);
  const requests = await Promise.allSettled([
    fetch(`${url}/control/valve.json?auth=${secret}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }),
    fetch(`${url}/control/pump.json?auth=${secret}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }),
  ]);
  return requests.some((r) => r.status === "fulfilled" && r.value.ok);
}

function buildDominantNutrientHint(phase: any) {
  if (!phase) return "Apply balanced nutrition for this phase.";
  const entries: Array<[string, number]> = [
    ["Nitrogen", phase.nitrogenKgPerFed ?? 0],
    ["Phosphorus", phase.phosphorusKgPerFed ?? 0],
    ["Potassium", phase.potassiumKgPerFed ?? 0],
    ["Calcium", phase.calciumKgPerFed ?? 0],
    ["Magnesium", phase.magnesiumKgPerFed ?? 0],
  ];
  const [nutrient, value] = entries.sort((a, b) => b[1] - a[1])[0];
  if (value <= 0) return "No fertilizer dose is recommended in this phase.";
  const guidanceByNutrient: Record<string, string> = {
    Nitrogen: "Use a nitrogen-rich growth mix.",
    Phosphorus: "Use a phosphorus-focused (phosphoric) acid/nutrient mix.",
    Potassium: "Use a potassium-rich fruiting mix.",
    Calcium: "Reinforce calcium to improve fruit quality and resilience.",
    Magnesium: "Add magnesium support for chlorophyll and leaf health.",
  };
  return `Focus nutrient now: ${nutrient} (${value} kg/fed). ${guidanceByNutrient[nutrient] ?? ""}`.trim();
}

function formatStopReason(stopReason: string) {
  if (stopReason === "high_temperature") return "Stopped automatically due to high temperature.";
  if (stopReason === "no_flow") return "Stopped automatically because flow dropped to zero.";
  if (stopReason === "max_duration") return "Stopped automatically at configured maximum duration.";
  if (stopReason === "manual_stop") return "Stopped manually by operator.";
  return "Stopped.";
}

export const getDeviceInternal = internalQuery({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deviceId);
  },
});

export const getLatestReadingInternal = internalQuery({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("readings")
      .withIndex("by_device_timestamp", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .first();
  },
});

export const getLatestEventByType = internalQuery({
  args: { deviceId: v.id("devices"), type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .filter((q) => q.eq(q.field("type"), args.type))
      .order("desc")
      .first();
  },
});

export const getFertilizationSessionInternal = internalQuery({
  args: { sessionId: v.id("fertilizationSessions") },
  handler: async (ctx, args) => await ctx.db.get(args.sessionId),
});

export const getActiveFertilizationSessionByDevice = internalQuery({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("fertilizationSessions")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .take(10);
    return sessions.find((s) => s.status === "active") ?? null;
  },
});

export const createFertilizationSession = internalMutation({
  args: {
    userId: v.id("users"),
    deviceId: v.id("devices"),
    startedAt: v.number(),
    expectedEndAt: v.number(),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("fertilizationSessions", {
      ...args,
      status: "active",
    });
  },
});

export const stopFertilizationSessionMutation = internalMutation({
  args: {
    sessionId: v.id("fertilizationSessions"),
    stoppedAt: v.number(),
    status: v.string(),
    stopReason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      stoppedAt: args.stoppedAt,
      status: args.status,
      stopReason: args.stopReason,
    });
  },
});

export const saveReading = internalMutation({
  args: {
    userId: v.id("users"),
    deviceId: v.id("devices"),
    moisture: v.number(),
    temperature: v.number(),
    flowRate: v.number(),
    pumpStatus: v.boolean(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("readings")
      .withIndex("by_device_timestamp", (q) =>
        q.eq("deviceId", args.deviceId).lt("timestamp", cutoff),
      )
      .collect();

    for (const r of old) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.insert("readings", {
      userId: args.userId,
      deviceId: args.deviceId,
      moisture: args.moisture,
      temperature: args.temperature,
      flowRate: args.flowRate,
      pumpStatus: args.pumpStatus,
      timestamp: args.timestamp,
    });
  },
});

export const logEventInternal = internalMutation({
  args: {
    userId: v.id("users"),
    deviceId: v.id("devices"),
    type: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", {
      userId: args.userId,
      deviceId: args.deviceId,
      type: args.type,
      message: args.message,
      data: args.data,
      timestamp: Date.now(),
    });

    const criticalTypes = new Set([
      "alert",
      "tank_empty_suspected",
      "fertilization_safety_stop",
      "critical_escalation",
    ]);
    const escalationCandidateTypes = new Set(["low_moisture", "alert"]);

    if (criticalTypes.has(args.type)) {
      await ctx.scheduler.runAfter(0, internal.alerts.dispatchExternalNotifications, {
        eventId,
      });
    }

    if (escalationCandidateTypes.has(args.type) && !args.data?.skipEscalation) {
      await ctx.scheduler.runAfter(0, internal.alerts.scheduleEscalationForEvent, {
        eventId,
      });
    }
  },
});

export const logPumpEvent = internalMutation({
  args: {
    userId: v.id("users"),
    deviceId: v.id("devices"),
    state: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("events", {
      userId: args.userId,
      deviceId: args.deviceId,
      type: "valve_control",
      message: `Valve turned ${args.state ? "ON" : "OFF"} manually. Next telemetry check in 30 seconds.`,
      data: {
        target: "valve",
        nextCheckAt: now + 30_000,
      },
      timestamp: now,
    });
  },
});

export const fetchAndSaveReadingInternal = internalAction({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const device = await ctx.runQuery(internal.readings.getDeviceInternal, {
      deviceId: args.deviceId,
    });

    if (!device || !device.isActive) return;

    const url = device.firebaseUrl;
    const secret = device.firebaseSecret;

    try {
      const readJsonSafe = async (res: Response | null) => {
        if (!res) return null;
        try {
          return await res.json();
        } catch {
          return null;
        }
      };

      const responses = await Promise.all([
        fetch(`${url}/sensor/moisture.json?auth=${secret}`),
        fetch(`${url}/sensor/air_temp.json?auth=${secret}`),
        fetch(`${url}/sensor/flow_rate.json?auth=${secret}`),
        fetch(`${url}/control/valve.json?auth=${secret}`).catch(() => null),
        fetch(`${url}/control/pump.json?auth=${secret}`),
      ]);

      const [moisture, temperature, flowRate, valveRaw, pumpRaw] =
        await Promise.all(
          responses.map((res) => readJsonSafe(res as Response | null)),
        );

      const controlRaw = pumpRaw ?? valveRaw;

      if (moisture === null || temperature === null || flowRate === null) {
        return;
      }

      const m = Math.min(100, Math.max(0, Number(moisture)));
      const t = Number(temperature);
      const f = Math.max(0, Number(flowRate));
      const p = controlRaw === 1 || controlRaw === true;
      const now = Date.now();

      const latestReading = await ctx.runQuery(
        internal.readings.getLatestReadingInternal,
        {
          deviceId: args.deviceId,
        },
      );

      const devicePlan = await ctx.runQuery(
        internal.agronomy.getDevicePlanInternal,
        {
          deviceId: args.deviceId,
        },
      );

      const wateringFrequency =
        devicePlan?.cultivationGuide?.wateringFrequency ?? null;
      const irrigationIntervalMs =
        estimateIrrigationIntervalMs(wateringFrequency);

      const latestIrrigationStartEvent = await ctx.runQuery(
        internal.readings.getLatestEventByType,
        {
          deviceId: args.deviceId,
          type: "irrigation_started",
        },
      );

      const lastIrrigationAt =
        latestIrrigationStartEvent?.timestamp ?? latestReading?.timestamp ?? now;
      const nextIrrigationAt = irrigationIntervalMs
        ? lastIrrigationAt + irrigationIntervalMs
        : undefined;

      if (devicePlan?.currentPhase) {
        const latestWeeklyPlanEvent = await ctx.runQuery(
          internal.readings.getLatestEventByType,
          {
            deviceId: args.deviceId,
            type: "weekly_agronomy_plan",
          },
        );

        if (
          !latestWeeklyPlanEvent ||
          latestWeeklyPlanEvent.data?.weekNumber !== devicePlan.currentWeek
        ) {
          const nutrientKgPerFed = buildNutrientKgPerFed(
            devicePlan.currentPhase,
          );
          const zoneDoseKg = buildZoneDoseKg(
            devicePlan.currentPhase,
            device.areaM2,
          );

          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "weekly_agronomy_plan",
            message: `Week ${devicePlan.currentWeek} (${devicePlan.currentPhase.weeksLabel}) plan for ${devicePlan.cropName}: ${devicePlan.nutrientSummary}. Irrigation cadence: ${wateringFrequency ?? "Not specified"}.${nextIrrigationAt ? ` Next irrigation around ${formatUtcTimestamp(nextIrrigationAt)}.` : ""}`,
            data: {
              weekNumber: devicePlan.currentWeek,
              weeksLabel: devicePlan.currentPhase.weeksLabel,
              applicationTiming: devicePlan.currentPhase.applicationTiming,
              criticalRemarks: devicePlan.currentPhase.criticalRemarks,
              nutrientSummary: devicePlan.nutrientSummary,
              nutrientKgPerFed,
              zoneAreaM2: device.areaM2,
              zoneDoseKg,
              wateringFrequency,
              lastIrrigationAt,
              nextIrrigationAt,
              moisture: m,
              temperature: t,
              flowRate: f,
            },
          });
        }
      }

      if (devicePlan?.currentPhase) {
        const latestPlanEvent = await ctx.runQuery(
          internal.readings.getLatestEventByType,
          {
            deviceId: args.deviceId,
            type: "fertilizer_plan",
          },
        );

        if (
          !latestPlanEvent ||
          latestPlanEvent.data?.weeksLabel !==
            devicePlan.currentPhase.weeksLabel
        ) {
          const nutrientKgPerFed = buildNutrientKgPerFed(devicePlan.currentPhase);
          const zoneDoseKg = buildZoneDoseKg(
            devicePlan.currentPhase,
            device.areaM2,
          );

          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "fertilizer_plan",
            message: `Fertilizer phase update for ${devicePlan.cropName} (${devicePlan.currentPhase.weeksLabel}): ${devicePlan.nutrientSummary}. ${devicePlan.currentPhase.criticalRemarks}${devicePlan.nextPhase ? ` Next phase: ${devicePlan.nextPhase.weeksLabel} (${devicePlan.nextPhase.applicationTiming}).` : ""}${nextIrrigationAt ? ` Next irrigation around ${formatUtcTimestamp(nextIrrigationAt)}.` : ""}`,
            data: {
              weeksLabel: devicePlan.currentPhase.weeksLabel,
              weekNumber: devicePlan.currentWeek,
              nextPhase: devicePlan.nextPhase?.weeksLabel,
              nextPhaseStartWeek: devicePlan.nextPhase?.startWeek,
              applicationTiming: devicePlan.currentPhase.applicationTiming,
              criticalRemarks: devicePlan.currentPhase.criticalRemarks,
              nutrientSummary: devicePlan.nutrientSummary,
              nutrientKgPerFed,
              zoneAreaM2: device.areaM2,
              zoneDoseKg,
              wateringFrequency,
              lastIrrigationAt,
              moisture: m,
              temperature: t,
              flowRate: f,
              nextIrrigationAt,
              nextReviewAt: now + 7 * 24 * 60 * 60 * 1000,
            },
          });
        }
      }

      const minThreshold = device.customMinMoisture ?? 30;

      if (m < minThreshold) {
        if (!latestReading || latestReading.moisture >= minThreshold) {
          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: m < minThreshold - 10 ? "alert" : "low_moisture",
            message: `Low moisture ${m}% in ${device.name}. Irrigation recommended now.${nextIrrigationAt ? ` Suggested next cycle target: ${formatUtcTimestamp(nextIrrigationAt)}.` : ""}${devicePlan?.nutrientSummary ? ` ${devicePlan.nutrientSummary}.` : ""}`,
            data: {
              moisture: m,
              temperature: t,
              flowRate: f,
              lastIrrigationAt,
              nextIrrigationAt,
              nextCheckAt: now + 30_000,
            },
          });
        }
      }

      if (t > 40) {
        if (!latestReading || latestReading.temperature <= 40) {
          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "alert",
            message: `High temperature ${t}C in ${device.name}. Check irrigation and shading.`,
            data: {
              moisture: m,
              temperature: t,
              flowRate: f,
              nextIrrigationAt,
              nextCheckAt: now + 30_000,
            },
          });
        }
      }

      let currentPumpStatus = p;
      let autoShutdownDueTankEmpty = false;

      if (p && f < 0.1) {
        if (
          latestReading &&
          latestReading.pumpStatus &&
          latestReading.flowRate < 0.1
        ) {
          currentPumpStatus = false;
          autoShutdownDueTankEmpty = true;
          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "tank_empty_suspected",
            message: `Tank empty suspected in ${device.name}: valve was ON while flow stayed at zero. Auto-shutdown applied to protect irrigation.`,
            data: {
              moisture: m,
              temperature: t,
              flowRate: f,
              actionTaken: "auto_shutdown",
              nextAction: "Refill tank and inspect line pressure before restarting.",
            },
          });
          try {
            await writeControlState(url, secret, false);
          } catch {}
        } else {
          if (
            !latestReading ||
            latestReading.flowRate >= 0.1 ||
            !latestReading.pumpStatus
          ) {
            await ctx.runMutation(internal.readings.logEventInternal, {
              userId: device.userId,
              deviceId: args.deviceId,
              type: "tank_empty_suspected",
              message: `Tank empty suspected in ${device.name}: flow is near zero while valve is ON. Check tank level, filter, or pipeline pressure.`,
              data: {
                moisture: m,
                temperature: t,
                flowRate: f,
                nextAction:
                  "Inspect tank and line before next irrigation cycle.",
                nextIrrigationAt,
              },
            });
          }
        }
      }

      if (!latestReading || latestReading.pumpStatus !== currentPumpStatus) {
        if (currentPumpStatus) {
          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "irrigation_started",
            message: `Irrigation started in ${device.name} at ${formatUtcTimestamp(now)}.${nextIrrigationAt ? ` Expected next cycle around ${formatUtcTimestamp(nextIrrigationAt)}.` : ""}`,
            data: {
              moisture: m,
              temperature: t,
              flowRate: f,
              wateringFrequency,
              lastIrrigationAt,
              nextIrrigationAt,
            },
          });
        } else if (!autoShutdownDueTankEmpty) {
          const latestIrrigationStopEvent = await ctx.runQuery(
            internal.readings.getLatestEventByType,
            {
              deviceId: args.deviceId,
              type: "irrigation_stopped",
            },
          );

          const validStart =
            latestIrrigationStartEvent &&
            (!latestIrrigationStopEvent ||
              latestIrrigationStartEvent.timestamp >
                latestIrrigationStopEvent.timestamp)
              ? latestIrrigationStartEvent.timestamp
              : undefined;

          const runtimeMinutes = validStart
            ? Number(((now - validStart) / 60000).toFixed(1))
            : undefined;

          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "irrigation_stopped",
            message: `Irrigation stopped in ${device.name} at ${formatUtcTimestamp(now)}.${runtimeMinutes !== undefined ? ` Runtime: ${runtimeMinutes} min.` : ""}${nextIrrigationAt ? ` Next suggested irrigation: ${formatUtcTimestamp(nextIrrigationAt)}.` : ""}`,
            data: {
              moisture: m,
              temperature: t,
              flowRate: f,
              runtimeMinutes,
              wateringFrequency,
              lastIrrigationAt,
              nextIrrigationAt,
            },
          });
        }
      }

      const shouldSave =
        !latestReading ||
        latestReading.pumpStatus !== currentPumpStatus ||
        Math.abs(latestReading.flowRate - f) > 0.1 ||
        Math.abs(latestReading.moisture - m) > 1 ||
        Math.abs(latestReading.temperature - t) > 0.5;

      if (shouldSave) {
        await ctx.runMutation(internal.readings.saveReading, {
          userId: device.userId,
          deviceId: args.deviceId,
          moisture: m,
          temperature: t,
          flowRate: f,
          pumpStatus: currentPumpStatus,
          timestamp: now,
        });
      }
    } catch {}
  },
});

export const pollDevice = internalAction({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const device = await ctx.runQuery(internal.readings.getDeviceInternal, {
      deviceId: args.deviceId,
    });
    if (!device || !device.isActive) return;
    await ctx.runAction(internal.readings.fetchAndSaveReadingInternal, {
      deviceId: args.deviceId,
    });
    await ctx.scheduler.runAfter(30000, internal.readings.pollDevice, {
      deviceId: args.deviceId,
    });
  },
});

export const fetchAndSaveReading = action({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.readings.fetchAndSaveReadingInternal, {
      deviceId: args.deviceId,
    });
  },
});

export const controlPump = action({
  args: { deviceId: v.id("devices"), state: v.boolean() },
  handler: async (ctx, args) => {
    const device = await ctx.runQuery(internal.readings.getDeviceInternal, {
      deviceId: args.deviceId,
    });
    if (!device) throw new Error("Device not found");

    const hasSuccess = await writeControlState(
      device.firebaseUrl,
      device.firebaseSecret,
      args.state,
    );

    if (!hasSuccess) throw new Error("Failed to control valve");

    await ctx.runMutation(internal.readings.logPumpEvent, {
      userId: device.userId,
      deviceId: args.deviceId,
      state: args.state,
    });

    if (!args.state) {
      const activeSession = await ctx.runQuery(
        internal.readings.getActiveFertilizationSessionByDevice,
        { deviceId: args.deviceId },
      );
      if (activeSession) {
        await ctx.runAction(internal.readings.stopFertilizationSessionInternal, {
          sessionId: activeSession._id,
          stopReason: "manual_stop",
        });
      }
    }
    return { success: true };
  },
});

export const stopFertilizationSessionInternal = internalAction({
  args: {
    sessionId: v.id("fertilizationSessions"),
    stopReason: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.readings.getFertilizationSessionInternal, {
      sessionId: args.sessionId,
    });
    if (!session || session.status !== "active") return { skipped: true };

    const device = await ctx.runQuery(internal.readings.getDeviceInternal, {
      deviceId: session.deviceId,
    });
    if (!device) return { skipped: true, reason: "device_missing" };

    await writeControlState(device.firebaseUrl, device.firebaseSecret, false);
    const stoppedAt = Date.now();
    await ctx.runMutation(internal.readings.stopFertilizationSessionMutation, {
      sessionId: session._id,
      stoppedAt,
      status: args.stopReason === "max_duration" ? "completed" : "stopped",
      stopReason: args.stopReason,
    });

    const latest = await ctx.runQuery(internal.readings.getLatestReadingInternal, {
      deviceId: session.deviceId,
    });

    const isSafetyStop = args.stopReason === "high_temperature" || args.stopReason === "no_flow";
    await ctx.runMutation(internal.readings.logEventInternal, {
      userId: session.userId,
      deviceId: session.deviceId,
      type: isSafetyStop ? "fertilization_safety_stop" : "fertilization_completed",
      message: `Fertilization session ended for ${device.name}. ${formatStopReason(args.stopReason)}`,
      data: {
        severity: isSafetyStop ? "critical" : "info",
        stopReason: args.stopReason,
        startedAt: session.startedAt,
        stoppedAt,
        expectedEndAt: session.expectedEndAt,
        durationMinutes: session.durationMinutes,
        temperature: latest?.temperature,
        flowRate: latest?.flowRate,
        moisture: latest?.moisture,
      },
    });

    return { success: true };
  },
});

export const monitorFertilizationSession = internalAction({
  args: { sessionId: v.id("fertilizationSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.readings.getFertilizationSessionInternal, {
      sessionId: args.sessionId,
    });
    if (!session || session.status !== "active") return;

    const latest = await ctx.runQuery(internal.readings.getLatestReadingInternal, {
      deviceId: session.deviceId,
    });
    const now = Date.now();

    if (latest?.temperature !== undefined && latest.temperature >= 40) {
      await ctx.runAction(internal.readings.stopFertilizationSessionInternal, {
        sessionId: session._id,
        stopReason: "high_temperature",
      });
      return;
    }

    if (latest?.flowRate !== undefined && latest.flowRate <= 0.1) {
      await ctx.runAction(internal.readings.stopFertilizationSessionInternal, {
        sessionId: session._id,
        stopReason: "no_flow",
      });
      return;
    }

    if (now >= session.expectedEndAt) {
      await ctx.runAction(internal.readings.stopFertilizationSessionInternal, {
        sessionId: session._id,
        stopReason: "max_duration",
      });
      return;
    }

    await ctx.scheduler.runAfter(30_000, internal.readings.monitorFertilizationSession, {
      sessionId: session._id,
    });
  },
});

export const startFertilization = action({
  args: {
    deviceId: v.id("devices"),
    durationMinutes: v.optional(v.number()),
    confirmed: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (!args.confirmed) {
      throw new Error("Fertilization must be explicitly confirmed");
    }

    const device = await ctx.runQuery(internal.readings.getDeviceInternal, {
      deviceId: args.deviceId,
    });
    if (!device || device.userId !== userId) throw new Error("Device not found");

    const existingSession = await ctx.runQuery(
      internal.readings.getActiveFertilizationSessionByDevice,
      { deviceId: args.deviceId },
    );
    if (existingSession) {
      throw new Error("A fertilization session is already active for this zone");
    }

    const hasSuccess = await writeControlState(
      device.firebaseUrl,
      device.firebaseSecret,
      true,
    );
    if (!hasSuccess) throw new Error("Failed to start fertilization valve");

    const durationMinutes = Math.max(
      1,
      Math.min(30, Math.floor(args.durationMinutes ?? 10)),
    );
    const now = Date.now();
    const expectedEndAt = now + durationMinutes * 60 * 1000;

    const sessionId = await ctx.runMutation(internal.readings.createFertilizationSession, {
      userId: device.userId,
      deviceId: args.deviceId,
      startedAt: now,
      expectedEndAt,
      durationMinutes,
    });

    await ctx.scheduler.runAfter(30_000, internal.readings.monitorFertilizationSession, {
      sessionId,
    });

    const latestReading = await ctx.runQuery(
      internal.readings.getLatestReadingInternal,
      {
        deviceId: args.deviceId,
      },
    );
    const devicePlan = await ctx.runQuery(internal.agronomy.getDevicePlanInternal, {
      deviceId: args.deviceId,
    });

    const nutrientKgPerFed = buildNutrientKgPerFed(devicePlan?.currentPhase);
    const zoneDoseKg = buildZoneDoseKg(devicePlan?.currentPhase, device.areaM2);
    const focusHint = buildDominantNutrientHint(devicePlan?.currentPhase);
    const weekText = devicePlan?.currentPhase?.weeksLabel
      ? `Week ${devicePlan.currentWeek} (${devicePlan.currentPhase.weeksLabel})`
      : `Week ${devicePlan?.currentWeek ?? 1}`;

    await ctx.runMutation(internal.readings.logEventInternal, {
      userId: device.userId,
      deviceId: args.deviceId,
      type: "fertilization_started",
      message: `Fertilization started for ${devicePlan?.cropName ?? "selected crop"} in ${device.name}. ${weekText} plan: ${devicePlan?.nutrientSummary ?? "No nutrient schedule found"}. ${focusHint} Recommended mixing window: ${formatUtcTimestamp(now)} to ${formatUtcTimestamp(expectedEndAt)}.`,
      data: {
        weekNumber: devicePlan?.currentWeek,
        weeksLabel: devicePlan?.currentPhase?.weeksLabel,
        applicationTiming: devicePlan?.currentPhase?.applicationTiming,
        criticalRemarks: devicePlan?.currentPhase?.criticalRemarks,
        nutrientSummary: devicePlan?.nutrientSummary,
        nutrientKgPerFed,
        zoneAreaM2: device.areaM2,
        zoneDoseKg,
        moisture: latestReading?.moisture,
        temperature: latestReading?.temperature,
        flowRate: latestReading?.flowRate,
        fertilizationStartedAt: now,
        recommendedEndAt: expectedEndAt,
        durationMinutes,
        safetyMode: {
          confirmed: true,
          maxDurationMinutes: 30,
          autoStopOnHighTemperatureC: 40,
          autoStopOnFlowRateLMin: 0.1,
        },
        sessionId,
        recommendedAction:
          "Inject the nutrient mix gradually while monitoring flow and moisture.",
      },
    });

    return {
      success: true,
      sessionId,
      expectedEndAt,
      durationMinutes,
      nutrientKgPerFed,
      zoneDoseKg,
    };
  },
});

export const getLatestReading = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) return null;
    return await ctx.db
      .query("readings")
      .withIndex("by_device_timestamp", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .first();
  },
});

export const getReadings24h = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) return [];
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return await ctx.db
      .query("readings")
      .withIndex("by_device_timestamp", (q) =>
        q.eq("deviceId", args.deviceId).gte("timestamp", since),
      )
      .order("asc")
      .collect();
  },
});

export const getReadings7d = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) return [];

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return await ctx.db
      .query("readings")
      .withIndex("by_device_timestamp", (q) =>
        q.eq("deviceId", args.deviceId).gte("timestamp", sevenDaysAgo),
      )
      .collect();
  },
});

export const getMoistureForecast = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) return null;

    const since = Date.now() - 48 * 60 * 60 * 1000;
    const readings = await ctx.db
      .query("readings")
      .withIndex("by_device_timestamp", (q) =>
        q.eq("deviceId", args.deviceId).gte("timestamp", since),
      )
      .order("asc")
      .collect();

    if (readings.length < 8) {
      return {
        status: "insufficient_data",
        message: "Need more readings for reliable forecast",
      };
    }

    const latest = readings[readings.length - 1];
    const minThreshold = device.customMinMoisture ?? 30;

    // Linear regression over the last 24-48h for moisture trend prediction.
    const x = readings.map((r) => (r.timestamp - readings[0].timestamp) / 3600000);
    const y = readings.map((r) => r.moisture);
    const n = x.length;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const denominator = n * sumXX - sumX * sumX;

    if (!Number.isFinite(denominator) || Math.abs(denominator) < 0.00001) {
      return {
        status: "unavailable",
        message: "Moisture trend is currently unstable",
      };
    }

    const slopePerHour = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slopePerHour * sumX) / n;

    const meanY = sumY / n;
    const ssTot = y.reduce((acc, yi) => acc + (yi - meanY) ** 2, 0);
    const ssRes = y.reduce(
      (acc, yi, i) => acc + (yi - (slopePerHour * x[i] + intercept)) ** 2,
      0,
    );
    const r2 = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;

    if (latest.moisture <= minThreshold) {
      return {
        status: "below_threshold",
        currentMoisture: latest.moisture,
        threshold: minThreshold,
        predictedDropAt: Date.now(),
        hoursToThreshold: 0,
        confidence: r2,
      };
    }

    if (slopePerHour >= -0.02) {
      return {
        status: "stable",
        currentMoisture: latest.moisture,
        threshold: minThreshold,
        slopePerHour,
        confidence: r2,
        message: "Moisture is stable or improving in the current window",
      };
    }

    const hoursToThreshold = (minThreshold - latest.moisture) / slopePerHour;
    if (!Number.isFinite(hoursToThreshold) || hoursToThreshold < 0 || hoursToThreshold > 240) {
      return {
        status: "unavailable",
        currentMoisture: latest.moisture,
        threshold: minThreshold,
        slopePerHour,
        confidence: r2,
        message: "Unable to produce a realistic threshold crossing forecast",
      };
    }

    return {
      status: "predicted",
      currentMoisture: latest.moisture,
      threshold: minThreshold,
      slopePerHour,
      confidence: r2,
      hoursToThreshold: Number(hoursToThreshold.toFixed(1)),
      predictedDropAt: Date.now() + hoursToThreshold * 3600000,
    };
  },
});

export const generateFakeData = mutation({
  args: {
    daysOffset: v.optional(v.number()),
    lowMoisture: v.optional(v.boolean()),
    highTemp: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const devices = await ctx.db.query("devices").collect();
    if (devices.length === 0) return "No devices found";
    const device = devices[0];

    const m = args.lowMoisture ? 12.0 : 55.0;
    const t = args.highTemp ? 45.0 : 28.0;
    const f = 1.5;
    const p = false;
    const ts = Date.now() - (args.daysOffset ?? 0) * 24 * 60 * 60 * 1000;

    await ctx.db.insert("readings", {
      userId: device.userId,
      deviceId: device._id,
      moisture: m,
      temperature: t,
      flowRate: f,
      pumpStatus: p,
      timestamp: ts,
    });

    if (m < 30 || t > 40) {
      await ctx.db.insert("events", {
        userId: device.userId,
        deviceId: device._id,
        type: "alert",
        message: `Test alert: Check values (M:${m}%, T:${t}C) in ${device.name}`,
        timestamp: ts,
      });
    }

    return `Success: Data generated with ${m < 30 || t > 40 ? "Alerts" : "Normal values"}`;
  },
});

export const seedHistoricalData = mutation({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("devices").collect();
    if (devices.length === 0) return "No devices found";

    const now = Date.now();
    let count = 0;

    for (const device of devices) {
      for (let i = 24; i >= 0; i--) {
        const m = 50 + Math.sin(i) * 20;
        const t = 25 + Math.cos(i) * 5;
        const isFlowing = i % 5 === 0;

        await ctx.db.insert("readings", {
          userId: device.userId,
          deviceId: device._id,
          moisture: parseFloat(m.toFixed(1)),
          temperature: parseFloat(t.toFixed(1)),
          flowRate: isFlowing ? parseFloat((2 + Math.random()).toFixed(1)) : 0,
          pumpStatus: isFlowing,
          timestamp: now - i * 60 * 60 * 1000,
        });
        count++;
      }
    }

    return `Success: Planted ${count} readings across ${devices.length} devices!`;
  },
});
