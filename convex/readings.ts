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

async function writeControlState(url: string, secret: string, state: boolean) {
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
  return `${nutrient} (${value} kg/fed). ${guidanceByNutrient[nutrient] ?? ""}`.trim();
}

function formatStopReason(stopReason: string) {
  if (stopReason === "high_temperature") return "High temperature detected";
  if (stopReason === "no_flow") return "Valve closed or flow dropped to zero";
  if (stopReason === "tank_empty")
    return "Tank empty suspected (flow remained at zero while valve was ON)";
  if (stopReason === "max_duration" || stopReason === "completed")
    return "Session completed successfully";
  if (stopReason === "manual_stop") return "Session was stopped manually";
  return "Stopped.";
}

export const getDeviceInternal = internalQuery({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deviceId);
  },
});

export const getActiveFertilizationSession = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const sessions = await ctx.db
      .query("fertilizationSessions")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .take(10);
    return sessions.find((s) => s.status === "active") ?? null;
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

export const getRecentReadingsInternal = internalQuery({
  args: { deviceId: v.id("devices"), limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("readings")
      .withIndex("by_device_timestamp", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .take(args.limit);
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
    isTest: v.optional(v.boolean()),
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
      isTest: args.isTest,
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
    deviceUpdates: v.optional(v.any()),
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

    if (args.deviceUpdates !== undefined) {
      await ctx.db.patch(args.deviceId, args.deviceUpdates);
    }

    const criticalTypes = new Set([
      "alert",
      "tank_empty_suspected",
      "fertilization_safety_stop",
      "critical_escalation",
    ]);
    const escalationCandidateTypes = new Set(["low_moisture", "alert"]);

    if (criticalTypes.has(args.type)) {
      await ctx.scheduler.runAfter(
        0,
        internal.alerts.dispatchExternalNotifications,
        {
          eventId,
        },
      );
    }

    if (escalationCandidateTypes.has(args.type) && !args.data?.skipEscalation) {
      await ctx.scheduler.runAfter(
        0,
        internal.alerts.scheduleEscalationForEvent,
        {
          eventId,
        },
      );
    }
  },
});

export const emergencyShutdownAtomic = internalMutation({
  args: {
    deviceId: v.id("devices"),
    reason: v.string(), // "tank_empty" | "high_temperature"
    moisture: v.number(),
    temperature: v.number(),
    flowRate: v.number(),
    isSimulation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const device = await ctx.db.get(args.deviceId);
    if (!device) return;

    // --- 1. Find & Stop Active Fertilization ---
    const sessions = await ctx.db
      .query("fertilizationSessions")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .take(10);
    const activeSession = sessions.find((s) => s.status === "active");

    let stoppedSession = false;
    if (activeSession) {
      await ctx.db.patch(activeSession._id, {
        status: "stopped",
        stoppedAt: now,
        stopReason: args.reason,
      });
      stoppedSession = true;

      const fertEventId = await ctx.db.insert("events", {
        userId: device.userId,
        deviceId: args.deviceId,
        type: "fertilization_safety_stop",
        message: `⚠️ Fertilization interrupted\nReason: ${args.reason === "tank_empty" ? "Tank Empty" : args.reason === "no_flow" ? "Valve OFF / No Flow" : "High Temperature"}`,
        data: {
          detailedMessage: formatStopReason(args.reason),
          severity: "critical",
          stopReason: args.reason,
          startedAt: activeSession.startedAt,
          stoppedAt: now,
          expectedEndAt: activeSession.expectedEndAt,
          durationMinutes: activeSession.durationMinutes,
          moisture: args.moisture,
          temperature: args.temperature,
          flowRate: args.flowRate,
          isSimulation: args.isSimulation,
          suppressToast: true,
        },
        timestamp: now,
      });

      await ctx.scheduler.runAfter(
        0,
        internal.alerts.dispatchExternalNotifications,
        { eventId: fertEventId },
      );
    }

    // --- 2. Record Irrigation Safety Stop ---
    if (args.reason === "tank_empty" || stoppedSession) {
      const events = await ctx.db
        .query("events")
        .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
        .order("desc")
        .take(50);
      const latestStart = events.find((e) => e.type === "irrigation_started");
      const latestStop = events.find(
        (e) =>
          e.type === "irrigation_stopped" ||
          e.type === "irrigation_safety_stop",
      );

      let validStart;
      if (
        latestStart &&
        (!latestStop || latestStart.timestamp > latestStop.timestamp)
      ) {
        validStart = latestStart.timestamp;
      }
      const runtimeMinutes =
        validStart !== undefined
          ? Number(((now - validStart) / 60000).toFixed(1))
          : 0;

      await ctx.db.insert("events", {
        userId: device.userId,
        deviceId: args.deviceId,
        type: "irrigation_safety_stop",
        message: `🛑 Irrigation stopped automatically\nReason: ${args.reason}`,
        data: {
          detailedMessage:
            args.reason === "tank_empty"
              ? `System automatically shut off the valve to prevent pump damage due to lack of water flow.`
              : args.reason === "no_flow"
                ? `Irrigation and fertilization aborted because the valve was turned off or flow dropped.`
                : `Fertilization stopped automatically to prevent crop stress.`,
          runtimeMinutes,
          lastIrrigationAt: validStart,
          moisture: args.moisture,
          temperature: args.temperature,
          flowRate: args.flowRate,
          stopReason: args.reason,
          isSimulation: args.isSimulation,
          suppressToast: true,
        },
        timestamp: now,
      });
    }

    // --- 3. Alert Event with Cooldown ---
    if (args.reason === "tank_empty") {
      const FLOW_COOLDOWN = 4 * 60 * 60 * 1000;
      const timeSinceLastTankEmpty = now - (device.lastTankEmptyAlertAt ?? 0);
      if (
        !device.isTankEmptySuspected ||
        timeSinceLastTankEmpty > FLOW_COOLDOWN
      ) {
        const msgBody = stoppedSession
          ? `Valve closed automatically. Fertilization stopped to protect the pump.`
          : `Valve closed automatically to protect the pump.`;

        const alertId = await ctx.db.insert("events", {
          userId: device.userId,
          deviceId: args.deviceId,
          type: "tank_empty_suspected",
          message: `⚠️ Tank empty detected\n${msgBody}`,
          data: {
            detailedMessage: `Valve was ON while flow stayed at zero for multiple checks. Refill tank and inspect line pressure before restarting.`,
            moisture: args.moisture,
            temperature: args.temperature,
            flowRate: args.flowRate,
            actionTaken: "auto_shutdown",
            isSimulation: args.isSimulation,
          },
          timestamp: now,
        });
        await ctx.db.patch(device._id, {
          isTankEmptySuspected: true,
          lastTankEmptyAlertAt: now,
          isFlowLow: true,
        });
        await ctx.scheduler.runAfter(
          0,
          internal.alerts.dispatchExternalNotifications,
          { eventId: alertId },
        );
        await ctx.scheduler.runAfter(
          0,
          internal.alerts.scheduleEscalationForEvent,
          { eventId: alertId },
        );
      } else {
        await ctx.db.patch(device._id, {
          isTankEmptySuspected: true,
          isFlowLow: true,
        });
      }
    } else if (args.reason === "high_temperature") {
      const TEMP_COOLDOWN = 4 * 60 * 60 * 1000;
      const timeSinceLastAlert = now - (device.lastTempAlertAt ?? 0);
      if (!device.isTempHigh || timeSinceLastAlert > TEMP_COOLDOWN) {
        const msgBody = stoppedSession
          ? `Fertilization stopped automatically to prevent crop stress.`
          : `Prolonged high temperatures may cause stress.`;

        const alertId = await ctx.db.insert("events", {
          userId: device.userId,
          deviceId: args.deviceId,
          type: "high_temperature",
          message: `⚠️ High temperature alert (${args.temperature}°C)\n${msgBody}`,
          data: {
            detailedMessage: `Prolonged high temperatures may cause stress. Check irrigation and shading.`,
            temperature: args.temperature,
            isSimulation: args.isSimulation,
          },
          timestamp: now,
        });
        await ctx.db.patch(device._id, {
          isTempHigh: true,
          lastTempAlertAt: now,
        });
        await ctx.scheduler.runAfter(
          0,
          internal.alerts.dispatchExternalNotifications,
          { eventId: alertId },
        );
      } else {
        await ctx.db.patch(device._id, { isTempHigh: true });
      }
    }
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
      let moisture: any = null;
      let temperature: any = null;
      let flowRate: any = null;
      let valveRaw: any = null;
      let pumpRaw: any = null;

      if (device.isSimulationMode) {
        // 5) Continuous Simulation Engine (Auto-generate realistic state)
        const recentReadings = await ctx.runQuery(
          internal.readings.getRecentReadingsInternal,
          { deviceId: args.deviceId, limit: 1 },
        );
        const latest = recentReadings[0];

        const currentM = latest?.moisture ?? 45;
        const currentT = latest?.temperature ?? 25;
        const currentP = latest?.pumpStatus ?? false;
        const currentF = latest?.flowRate ?? 0;

        // Realistic Sensor Inertia & Physics (Ultra-smooth for charts)
        if (currentP) {
          moisture = Math.min(100, currentM + (100 - currentM) * 0.004); // ultra slow easing up
        } else {
          moisture = Math.max(0, currentM - currentM * 0.0002 - 0.003); // microscopic decay
        }

        // Temperature drift (minimal jitter)
        const tempDrift = Math.random() * 0.01 - 0.005;
        temperature = Math.min(45, Math.max(10, currentT + tempDrift));

        // Flow rate inertia (gradual rise and fall, minimal noise)
        // If flow is forced to 0 while pump is ON, assume a simulated failure (tank empty test)
        const isSimulatingFailure = currentP && currentF < 0.05;
        const targetFlow = currentP && !isSimulatingFailure ? 1.5 : 0;
        flowRate =
          currentF +
          (targetFlow - currentF) * 0.05 +
          (currentP ? Math.random() * 0.006 - 0.003 : 0);

        moisture = Number(moisture.toFixed(2));
        temperature = Number(temperature.toFixed(2));
        flowRate = Math.max(0, Number(flowRate.toFixed(2)));
        pumpRaw = currentP ? 1 : 0;
        valveRaw = currentP ? 1 : 0;
      } else if (
        device.testOverrideUntil &&
        Date.now() < device.testOverrideUntil
      ) {
        // ─── LIVE TEST OVERRIDE ───
        // Pause Firebase polling and freeze the last injected reading for QA testing.
        const recentReadings = await ctx.runQuery(
          internal.readings.getRecentReadingsInternal,
          { deviceId: args.deviceId, limit: 1 },
        );
        const latest = recentReadings[0];

        if (latest) {
          moisture = latest.moisture;
          temperature = latest.temperature;
          flowRate = latest.flowRate;
          pumpRaw = latest.pumpStatus ? 1 : 0;
          valveRaw = latest.pumpStatus ? 1 : 0;
        } else {
          return;
        }
      } else {
        // Live Firebase Polling
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

        [moisture, temperature, flowRate, valveRaw, pumpRaw] =
          await Promise.all(
            responses.map((res) => readJsonSafe(res as Response | null)),
          );
      }

      const controlRaw = pumpRaw ?? valveRaw;

      if (moisture === null || temperature === null || flowRate === null) {
        return;
      }

      const m = Math.min(100, Math.max(0, Number(moisture)));
      const t = Number(temperature);
      const f = Math.max(0, Number(flowRate));
      const p = controlRaw === 1 || controlRaw === true;
      const now = Date.now();

      const activeSession = await ctx.runQuery(
        internal.readings.getActiveFertilizationSessionByDevice,
        { deviceId: args.deviceId },
      );

      // --- Defensive Guard: Force stop fertilization if pump is unexpectedly OFF ---
      if (activeSession && !p) {
        await ctx.runMutation(internal.readings.emergencyShutdownAtomic, {
          deviceId: args.deviceId,
          reason: "no_flow",
          moisture: m,
          temperature: t,
          flowRate: f,
          isSimulation: device.isSimulationMode ?? false,
        });
      }

      const recentReadings = await ctx.runQuery(
        internal.readings.getRecentReadingsInternal,
        {
          deviceId: args.deviceId,
          limit: 3,
        },
      );
      const latestReading = recentReadings[0] ?? null;

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

      const lastIrrigationAt = latestIrrigationStartEvent?.timestamp ?? "none";

      const nextIrrigationAt = irrigationIntervalMs
        ? (latestIrrigationStartEvent?.timestamp ?? now) + irrigationIntervalMs
        : undefined;

      if (device.plantId && devicePlan?.currentPhase) {
        if ((device as any).lastWeeklyPlanWeek !== devicePlan.currentWeek) {
          const nutrientKgPerFed = buildNutrientKgPerFed(
            devicePlan.currentPhase,
          );
          const zoneDoseKg = buildZoneDoseKg(
            devicePlan.currentPhase,
            device.areaM2,
          );

          const isFirstPlan = (device as any).lastWeeklyPlanWeek === undefined;

          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "weekly_agronomy_plan",
            message: `📅 Week ${devicePlan.currentWeek} plan\n${devicePlan.cropName}`,
            data: {
              detailedMessage: `Irrigation cadence is ${wateringFrequency ?? "not set"}.`,
              weekNumber: devicePlan.currentWeek,
              phase: devicePlan.currentPhase.applicationTiming,
              remarks: devicePlan.currentPhase.criticalRemarks,
              wateringCadence: wateringFrequency,
              lastIrrigationAt,
              nextIrrigationAt,
              source: isFirstPlan ? "zone_created" : "plan_update",
              suppressToast: true,
              displayMode: "in_app_only",
            },
            deviceUpdates: { lastWeeklyPlanWeek: devicePlan.currentWeek },
          });
        }
      }

      if (device.plantId && devicePlan?.currentPhase) {
        if (
          (device as any).lastFertilizerPhaseLabel !==
          devicePlan.currentPhase.weeksLabel
        ) {
          const nutrientKgPerFed = buildNutrientKgPerFed(
            devicePlan.currentPhase,
          );
          const zoneDoseKg = buildZoneDoseKg(
            devicePlan.currentPhase,
            device.areaM2,
          );

          const isFirstFertilizer =
            (device as any).lastFertilizerPhaseLabel === undefined;
          const fertStr = nutrientKgPerFed
            ? `N ${nutrientKgPerFed.nitrogen} / P ${nutrientKgPerFed.phosphorus} / K ${nutrientKgPerFed.potassium} / Ca ${nutrientKgPerFed.calcium} / Mg ${nutrientKgPerFed.magnesium} kg/fed`
            : "None";

          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "fertilizer_plan",
            message: `🌱 Phase update\n${devicePlan.cropName} • ${devicePlan.currentPhase.applicationTiming}`,
            data: {
              detailedMessage: `Nutrient schedule updated for new phase.`,
              weeksLabel: devicePlan.currentPhase.weeksLabel,
              weekNumber: devicePlan.currentWeek,
              nutrients: devicePlan.nutrientSummary,
              doseKgPerFed: nutrientKgPerFed,
              zoneDoseKg,
              nextPhase: devicePlan.nextPhase
                ? `Week ${devicePlan.nextPhase.startWeek} (${devicePlan.nextPhase.applicationTiming})`
                : undefined,
              nextReviewAt: now + 7 * 24 * 60 * 60 * 1000,
              source: isFirstFertilizer ? "zone_created" : "plan_update",
              suppressToast: true,
              displayMode: "in_app_only",
            },
            deviceUpdates: {
              lastFertilizerPhaseLabel: devicePlan.currentPhase.weeksLabel,
            },
          });
        }
      }

      let currentPumpStatus = p;
      let autoShutdownDueTankEmpty = false;

      const isFlowLowNow = p && f < 0.1;
      const wasFlowLowR1 = recentReadings[0]
        ? recentReadings[0].pumpStatus && recentReadings[0].flowRate < 0.1
        : false;
      const wasFlowLowR2 = recentReadings[1]
        ? recentReadings[1].pumpStatus && recentReadings[1].flowRate < 0.1
        : false;

      const pumpRunningLongEnough =
        recentReadings[0]?.pumpStatus && recentReadings[1]?.pumpStatus;

      const isNewSession = !latestReading || latestReading.pumpStatus === false;

      // ─── Flow Recovery ───
      if (p && f >= 0.5) {
        if (device.isFlowLow || device.isTankEmptySuspected) {
          if (!isNewSession) {
            await ctx.runMutation(internal.readings.logEventInternal, {
              userId: device.userId,
              deviceId: args.deviceId,
              type: "flow_recovered",
              message: `✅ Flow recovered\nCurrent: ${f} L/min`,
              data: {
                detailedMessage: `Water flow has returned to normal operating levels.`,
                flowRate: f,
                isSimulation: device.isSimulationMode,
              },
              deviceUpdates: { isFlowLow: false, isTankEmptySuspected: false },
            });
          }
        }
      } else if (isFlowLowNow && pumpRunningLongEnough) {
        const FLOW_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours

        if (wasFlowLowR1 && wasFlowLowR2) {
          // ─── Tank Empty Escalation (3 consecutive bad readings) ───
          currentPumpStatus = false;
          autoShutdownDueTankEmpty = true;

          if (!device.isSimulationMode) {
            try {
              await writeControlState(url, secret, false);
            } catch {}
          }

          await ctx.runMutation(internal.readings.emergencyShutdownAtomic, {
            deviceId: args.deviceId,
            reason: "tank_empty",
            moisture: m,
            temperature: t,
            flowRate: f,
            isSimulation: device.isSimulationMode ?? false,
          });
        } else if (wasFlowLowR1 && !wasFlowLowR2) {
          // ─── Low Flow Warning (2 consecutive bad readings) ───
          const timeSinceLastLowFlow = now - (device.lastFlowAlertAt ?? 0);

          if (!device.isFlowLow || timeSinceLastLowFlow > FLOW_COOLDOWN) {
            await ctx.runMutation(internal.readings.logEventInternal, {
              userId: device.userId,
              deviceId: args.deviceId,
              type: "low_flow_warning",
              message: `⚠️ Low flow warning\nCheck tank level or filter`,
              data: {
                detailedMessage: `Flow is near zero while valve is ON. Inspect tank and line. If it persists, system will auto-shutdown.`,
                flowRate: f,
                isSimulation: device.isSimulationMode,
              },
              deviceUpdates: { isFlowLow: true, lastFlowAlertAt: now },
            });
          }
        }
      }

      const isSensorPending = m === 0 && t === 0 && f === 0;
      const hasEnoughHistory = recentReadings.length >= 3;
      const minThreshold = device.customMinMoisture ?? 30;

      if (hasEnoughHistory && !isSensorPending) {
        // ─── 1) Moisture Deduplication & Recovery ───
        const mIsBad = m < minThreshold;
        const mR1Bad = recentReadings[0]
          ? recentReadings[0].moisture < minThreshold
          : false;
        const mR2Bad = recentReadings[1]
          ? recentReadings[1].moisture < minThreshold
          : false;
        const isConsistentlyLow = mIsBad && mR1Bad && mR2Bad;

        if (isConsistentlyLow && !currentPumpStatus) {
          const MOISTURE_COOLDOWN = 6 * 60 * 60 * 1000; // 6 hours cooldown
          const timeSinceLastAlert = now - (device.lastMoistureAlertAt ?? 0);

          if (!device.isMoistureLow || timeSinceLastAlert > MOISTURE_COOLDOWN) {
            await ctx.runMutation(internal.readings.logEventInternal, {
              userId: device.userId,
              deviceId: args.deviceId,
              type: "low_moisture",
              message: `💧 Low moisture alert\nCurrent: ${m}% (Target: >${minThreshold}%)`,
              data: {
                detailedMessage: `Irrigation is recommended now.${nextIrrigationAt ? ` Suggested next cycle target: ${formatUtcTimestamp(nextIrrigationAt)}.` : ""}`,
                moisture: m,
                temperature: t,
                isSimulation: device.isSimulationMode,
              },
              deviceUpdates: { isMoistureLow: true, lastMoistureAlertAt: now },
            });
          }
        } else if (device.isMoistureLow && m >= minThreshold + 5) {
          // Moisture recovered (added +5% hysteresis to prevent flip-flopping)
          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "moisture_recovered",
            message: `✅ Moisture recovered\nCurrent: ${m}%`,
            data: {
              detailedMessage: `Soil moisture levels have returned to normal operating range.`,
              moisture: m,
              isSimulation: device.isSimulationMode,
            },
            deviceUpdates: { isMoistureLow: false },
          });
        }

        // ─── 2) Temperature Deduplication & Recovery ───
        const tIsBad = t >= 40;
        const tR1Bad = recentReadings[0]
          ? recentReadings[0].temperature >= 40
          : false;
        const tR2Bad = recentReadings[1]
          ? recentReadings[1].temperature >= 40
          : false;
        const isConsistentlyHot = tIsBad && tR1Bad && tR2Bad;

        if (isConsistentlyHot) {
          if (activeSession) {
            if (!device.isSimulationMode) {
              try {
                await writeControlState(url, secret, false);
              } catch {}
            }
            currentPumpStatus = false;
          }

          await ctx.runMutation(internal.readings.emergencyShutdownAtomic, {
            deviceId: args.deviceId,
            reason: "high_temperature",
            moisture: m,
            temperature: t,
            flowRate: f,
            isSimulation: device.isSimulationMode ?? false,
          });
        } else if (device.isTempHigh && t <= 35) {
          // Temperature recovered
          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "temp_recovered",
            message: `✅ Temperature normalized\nCurrent: ${t}°C`,
            data: {
              detailedMessage: `Temperature has dropped back to safe operating levels.`,
              temperature: t,
              isSimulation: device.isSimulationMode,
            },
            deviceUpdates: { isTempHigh: false },
          });
        }
      }

      const latestIrrigationStopEvent = await ctx.runQuery(
        internal.readings.getLatestEventByType,
        { deviceId: args.deviceId, type: "irrigation_stopped" },
      );

      if (!latestReading || latestReading.pumpStatus !== currentPumpStatus) {
        if (!latestReading?.isTest || device.isSimulationMode) {
          if (currentPumpStatus) {
            await ctx.runMutation(internal.readings.logEventInternal, {
              userId: device.userId,
              deviceId: args.deviceId,
              type: "irrigation_started",
              message: `💧 Irrigation started\n${devicePlan?.cropName ?? "Zone"} • Valve opened manually`,
              data: {
                cropName: devicePlan?.cropName,
                sessionStartedAt: now,
                nextIrrigationAt,
                moisture: m,
                temperature: t,
                flowRate: f,
                isSimulation: device.isSimulationMode,
              },
              deviceUpdates: { isFlowLow: false, isTankEmptySuspected: false },
            });
          } else if (!autoShutdownDueTankEmpty) {
            const openIrrigationStartTimestamp =
              latestIrrigationStartEvent &&
              (!latestIrrigationStopEvent ||
                latestIrrigationStartEvent.timestamp >
                  latestIrrigationStopEvent.timestamp)
                ? latestIrrigationStartEvent.timestamp
                : undefined;

            const validStart =
              openIrrigationStartTimestamp ??
              (latestReading?.pumpStatus ? latestReading.timestamp : undefined);

            // Avoid false "stopped" events on first telemetry poll when valve is already OFF.
            if (validStart !== undefined) {
              const runtimeMinutes = Number(
                ((now - validStart) / 60000).toFixed(1),
              );

              // Prevent duplicate "Irrigation Stopped" if Fertilization just ended
              const latestFertiStop = await ctx.runQuery(
                internal.readings.getLatestEventByType,
                { deviceId: args.deviceId, type: "fertilization_completed" },
              );
              const fertiJustStopped =
                latestFertiStop && now - latestFertiStop.timestamp < 60000;

              if (!fertiJustStopped) {
                await ctx.runMutation(internal.readings.logEventInternal, {
                  userId: device.userId,
                  deviceId: args.deviceId,
                  type: "irrigation_stopped",
                  message: `✅ Irrigation stopped\n${devicePlan?.cropName ?? "Zone"} • Duration: ${runtimeMinutes} min`,
                  data: {
                    cropName: devicePlan?.cropName,
                    runtimeMinutes,
                    lastIrrigationAt: validStart,
                    nextIrrigationAt,
                    moisture: m,
                    temperature: t,
                    flowRate: f,
                    isSimulation: device.isSimulationMode,
                  },
                });
              }
            }
          }
        }
      }

      const isOverrideActive =
        device.testOverrideUntil && Date.now() < device.testOverrideUntil;

      const shouldSave =
        !latestReading ||
        latestReading.pumpStatus !== currentPumpStatus ||
        Math.abs(latestReading.flowRate - f) > 0.1 ||
        Math.abs(latestReading.moisture - m) > 1 ||
        Math.abs(latestReading.temperature - t) > 0.5 ||
        (p && f < 0.1) ||
        t >= 40 ||
        m < minThreshold;

      if (shouldSave) {
        await ctx.runMutation(internal.readings.saveReading, {
          userId: device.userId,
          deviceId: args.deviceId,
          moisture: m,
          temperature: t,
          flowRate: f,
          pumpStatus: currentPumpStatus,
          timestamp: now,
          isTest: device.isSimulationMode || !!isOverrideActive,
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

    let hasSuccess = true;
    if (device.isSimulationMode) {
      // DEV/TEST: Mock control by injecting a fake reading
      const latest = await ctx.runQuery(
        internal.readings.getLatestReadingInternal,
        {
          deviceId: args.deviceId,
        },
      );
      await ctx.runMutation(internal.readings.saveReading, {
        userId: device.userId,
        deviceId: args.deviceId,
        moisture: latest?.moisture ?? 50,
        temperature: latest?.temperature ?? 25,
        flowRate: args.state ? 2.5 : 0,
        pumpStatus: args.state,
        timestamp: Date.now(),
        isTest: true,
      });
    } else {
      hasSuccess = await writeControlState(
        device.firebaseUrl,
        device.firebaseSecret,
        args.state,
      );
    }

    if (!hasSuccess) throw new Error("Failed to control valve");

    if (!args.state) {
      const activeSession = await ctx.runQuery(
        internal.readings.getActiveFertilizationSessionByDevice,
        { deviceId: args.deviceId },
      );
      if (activeSession) {
        await ctx.runAction(
          internal.readings.stopFertilizationSessionInternal,
          {
            sessionId: activeSession._id,
            stopReason: "manual_stop",
          },
        );
      }
    }
    return { success: true };
  },
});

export const toggleSimulationMode = mutation({
  args: { deviceId: v.id("devices"), enabled: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) {
      throw new Error("Device not found or you don't have permission");
    }

    await ctx.db.patch(args.deviceId, { isSimulationMode: args.enabled });

    await ctx.db.insert("events", {
      userId: userId,
      deviceId: args.deviceId,
      type: "simulation_mode_toggled",
      message: `Simulation mode for ${device.name} has been ${
        args.enabled ? "enabled" : "disabled"
      }.`,
      timestamp: Date.now(),
      data: { enabled: args.enabled },
    });

    return { success: true };
  },
});

export const stopFertilizationSessionInternal = internalAction({
  args: {
    sessionId: v.id("fertilizationSessions"),
    stopReason: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(
      internal.readings.getFertilizationSessionInternal,
      {
        sessionId: args.sessionId,
      },
    );
    if (!session || session.status !== "active") return { skipped: true };

    const device = await ctx.runQuery(internal.readings.getDeviceInternal, {
      deviceId: session.deviceId,
    });
    if (!device) return { skipped: true, reason: "device_missing" };

    if (!device.isSimulationMode) {
      await writeControlState(device.firebaseUrl, device.firebaseSecret, false);
    } else {
      // Instant UI feedback for simulation mode
      const latest = await ctx.runQuery(
        internal.readings.getLatestReadingInternal,
        { deviceId: session.deviceId },
      );
      if (latest && latest.pumpStatus) {
        await ctx.runMutation(internal.readings.saveReading, {
          userId: device.userId,
          deviceId: session.deviceId,
          moisture: latest.moisture,
          temperature: latest.temperature,
          flowRate: 0,
          pumpStatus: false,
          timestamp: Date.now(),
          isTest: true,
        });
      }
    }
    const stoppedAt = Date.now();
    await ctx.runMutation(internal.readings.stopFertilizationSessionMutation, {
      sessionId: session._id,
      stoppedAt,
      status: args.stopReason === "max_duration" ? "completed" : "stopped",
      stopReason: args.stopReason,
    });

    const latest = await ctx.runQuery(
      internal.readings.getLatestReadingInternal,
      {
        deviceId: session.deviceId,
      },
    );

    const isSafetyStop =
      args.stopReason === "high_temperature" || args.stopReason === "no_flow";

    let shortMessage = "";
    let eventType = "fertilization_completed";

    if (args.stopReason === "max_duration" || args.stopReason === "completed") {
      shortMessage = `✅ Fertilization completed\nDuration: ${session.durationMinutes} min`;
    } else if (args.stopReason === "manual_stop") {
      shortMessage = `🛑 Fertilization stopped manually\nDuration: ${session.durationMinutes} min`;
      eventType = "fertilization_stopped";
    } else if (isSafetyStop) {
      const reasonStr =
        args.stopReason === "no_flow"
          ? "No Flow"
          : args.stopReason === "tank_empty"
            ? "Tank Empty"
            : "High Temperature";
      shortMessage = `⚠️ Fertilization interrupted\nReason: ${reasonStr}`;
      eventType = "fertilization_safety_stop";
    } else {
      shortMessage = `🛑 Fertilization stopped\nReason: ${formatStopReason(args.stopReason)}`;
      eventType = "fertilization_stopped";
    }

    await ctx.runMutation(internal.readings.logEventInternal, {
      userId: session.userId,
      deviceId: session.deviceId,
      type: eventType,
      message: shortMessage,
      data: {
        detailedMessage: formatStopReason(args.stopReason),
        severity: isSafetyStop ? "critical" : "info",
        stopReason: args.stopReason,
        startedAt: session.startedAt,
        stoppedAt,
        expectedEndAt: session.expectedEndAt,
        durationMinutes: session.durationMinutes,
        temperature: latest?.temperature,
        flowRate: latest?.flowRate,
        moisture: latest?.moisture,
        suppressToast: isSafetyStop ? true : undefined,
      },
    });

    return { success: true };
  },
});

export const monitorFertilizationSession = internalAction({
  args: { sessionId: v.id("fertilizationSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(
      internal.readings.getFertilizationSessionInternal,
      {
        sessionId: args.sessionId,
      },
    );
    if (!session || session.status !== "active") return;

    const latest = await ctx.runQuery(
      internal.readings.getLatestReadingInternal,
      {
        deviceId: session.deviceId,
      },
    );
    const now = Date.now();

    if (now >= session.expectedEndAt) {
      await ctx.runAction(internal.readings.stopFertilizationSessionInternal, {
        sessionId: session._id,
        stopReason: "max_duration",
      });
      return;
    }

    await ctx.scheduler.runAfter(
      30_000,
      internal.readings.monitorFertilizationSession,
      {
        sessionId: session._id,
      },
    );
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
    if (!device || device.userId !== userId)
      throw new Error("Device not found");
    if (!device.plantId) {
      throw new Error(
        "Fertilization requires a crop type to be assigned to the zone.",
      );
    }

    const existingSession = await ctx.runQuery(
      internal.readings.getActiveFertilizationSessionByDevice,
      { deviceId: args.deviceId },
    );
    if (existingSession) {
      throw new Error(
        "Fertilization is already running\nPlease stop the current session first.",
      );
    }

    const latestReading = await ctx.runQuery(
      internal.readings.getLatestReadingInternal,
      {
        deviceId: args.deviceId,
      },
    );

    // 7) Fertilization Preconditions Validation
    if (!latestReading || !latestReading.pumpStatus) {
      throw new Error(
        "Cannot start fertilization because water flow is unavailable\nPlease start irrigation first.",
      );
    }
    if (latestReading.flowRate < 0.1 && !device.isSimulationMode) {
      throw new Error(
        "Cannot start fertilization because water flow is unavailable\nEnsure pipelines are pressurized before fertilizing.",
      );
    }
    const minThreshold = device.customMinMoisture ?? 30;
    if (latestReading.moisture < minThreshold) {
      throw new Error(
        `Low moisture\nIrrigate with pure water first (Current: ${latestReading.moisture}%).`,
      );
    }

    let hasSuccess = true;
    if (!device.isSimulationMode) {
      hasSuccess = await writeControlState(
        device.firebaseUrl,
        device.firebaseSecret,
        true,
      );
    }
    if (!hasSuccess) throw new Error("Failed to start fertilization valve");

    const durationMinutes = Math.max(
      1,
      Math.min(30, Math.floor(args.durationMinutes ?? 10)),
    );
    const now = Date.now();
    const expectedEndAt = now + durationMinutes * 60 * 1000;

    const sessionId = await ctx.runMutation(
      internal.readings.createFertilizationSession,
      {
        userId: device.userId,
        deviceId: args.deviceId,
        startedAt: now,
        expectedEndAt,
        durationMinutes,
      },
    );

    await ctx.scheduler.runAfter(
      30_000,
      internal.readings.monitorFertilizationSession,
      {
        sessionId,
      },
    );

    const devicePlan = await ctx.runQuery(
      internal.agronomy.getDevicePlanInternal,
      {
        deviceId: args.deviceId,
      },
    );

    const nutrientKgPerFed = buildNutrientKgPerFed(devicePlan?.currentPhase);
    const zoneDoseKg = buildZoneDoseKg(devicePlan?.currentPhase, device.areaM2);
    const focusHint = buildDominantNutrientHint(devicePlan?.currentPhase);
    const weekText = devicePlan?.currentPhase?.weeksLabel
      ? `Week ${devicePlan.currentWeek} (${devicePlan.currentPhase.weeksLabel})`
      : `Week ${devicePlan?.currentWeek ?? 1}`;

    const cropName = devicePlan?.cropName ?? "Selected Crop";

    await ctx.runMutation(internal.readings.logEventInternal, {
      userId: device.userId,
      deviceId: args.deviceId,
      type: "fertilization_started",
      message: `🧪 Fertilization started\n${cropName} • Week ${devicePlan?.currentWeek ?? 1}`,
      data: {
        detailedMessage: focusHint,
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

// 6) Device Health Monitoring
export const getDeviceHealth = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) return null;

    const latest = await ctx.db
      .query("readings")
      .withIndex("by_device_timestamp", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .first();

    const now = Date.now();
    const lastHeartbeat = latest?.timestamp ?? 0;
    const isOnline = now - lastHeartbeat < 3 * 60 * 1000; // 3 minutes timeout

    return {
      isOnline,
      lastHeartbeat,
      status: isOnline ? "Online" : "Offline",
    };
  },
});

// 8) Add System Activity Timeline
export const getDeviceTimeline = query({
  args: { deviceId: v.id("devices"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("events")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getLatestReading = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) return null;
    return (
      (await ctx.db
        .query("readings")
        .withIndex("by_device_timestamp", (q) =>
          q.eq("deviceId", args.deviceId),
        )
        .order("desc")
        .first()) ?? null
    );
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
    const x = readings.map(
      (r) => (r.timestamp - readings[0].timestamp) / 3600000,
    );
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
    if (
      !Number.isFinite(hoursToThreshold) ||
      hoursToThreshold < 0 ||
      hoursToThreshold > 240
    ) {
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
      isTest: true,
    });

    return `Success: Data generated`;
  },
});

export const generateFakeDataForDevice = mutation({
  args: {
    deviceId: v.id("devices"),
    moisture: v.number(),
    temperature: v.number(),
    flowRate: v.number(),
    pumpStatus: v.boolean(),
    overrideMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId)
      throw new Error("Device not found");

    const ts = Date.now();
    const overrideMins = args.overrideMinutes ?? 3;

    await ctx.db.insert("readings", {
      userId: device.userId,
      deviceId: device._id,
      moisture: args.moisture,
      temperature: args.temperature,
      flowRate: args.flowRate,
      pumpStatus: args.pumpStatus,
      timestamp: ts,
      isTest: true,
    });

    await ctx.db.patch(device._id, {
      testOverrideUntil: ts + overrideMins * 60 * 1000,
    });

    return `Success: Fake data generated for ${device.name}. Live Firebase polling PAUSED for ${overrideMins} minutes.`;
  },
});

export const generateFakeDataForDeviceDev = mutation({
  args: {
    deviceId: v.id("devices"),
    moisture: v.number(),
    temperature: v.number(),
    flowRate: v.number(),
    pumpStatus: v.boolean(),
    overrideMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // DEV ONLY: No auth check.
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    const ts = Date.now();
    const overrideMins = args.overrideMinutes ?? 3;

    await ctx.db.insert("readings", {
      userId: device.userId,
      deviceId: device._id,
      moisture: args.moisture,
      temperature: args.temperature,
      flowRate: args.flowRate,
      pumpStatus: args.pumpStatus,
      timestamp: ts,
      isTest: true,
    });

    await ctx.db.patch(device._id, {
      testOverrideUntil: ts + overrideMins * 60 * 1000,
    });

    return `Success: Fake data generated for ${device.name} (DEV). Live Firebase polling PAUSED for ${overrideMins} minutes.`;
  },
});

export const clearTestOverride = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId)
      throw new Error("Device not found");

    await ctx.db.patch(device._id, {
      testOverrideUntil: undefined,
    });

    return `Success: Test override cleared for ${device.name}. Live Firebase polling resumed.`;
  },
});

export const clearTestOverrideDev = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    // DEV ONLY: No auth check.
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    await ctx.db.patch(device._id, {
      testOverrideUntil: undefined,
    });

    return `Success: Test override cleared for ${device.name} (DEV). Live Firebase polling resumed.`;
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
