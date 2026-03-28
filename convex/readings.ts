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
import { api, internal } from "./_generated/api";

export const getDeviceInternal = internalQuery({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deviceId);
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("events", {
      userId: args.userId,
      deviceId: args.deviceId,
      type: args.type,
      message: args.message,
      timestamp: Date.now(),
    });
  },
});

export const logPumpEvent = internalMutation({
  args: {
    userId: v.id("users"),
    deviceId: v.id("devices"),
    state: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("events", {
      userId: args.userId,
      deviceId: args.deviceId,
      type: "pump_control",
      message: `Pump turned ${args.state ? "ON" : "OFF"} manually`,
      timestamp: Date.now(),
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
      const responses = await Promise.all([
        fetch(`${url}/sensor/moisture.json?auth=${secret}`),
        fetch(`${url}/sensor/air_temp.json?auth=${secret}`),
        fetch(`${url}/sensor/flow_rate.json?auth=${secret}`),
        fetch(`${url}/control/pump.json?auth=${secret}`),
      ]);

      const [moisture, temperature, flowRate, pumpRaw] = await Promise.all(
        responses.map((res) => res.json()),
      );

      if (moisture === null || temperature === null || flowRate === null)
        return;

      const m = Math.min(100, Math.max(0, Number(moisture)));
      const t = Number(temperature);
      const f = Math.max(0, Number(flowRate));
      const p = pumpRaw === 1 || pumpRaw === true;

      const latestReading = await ctx.runQuery(api.readings.getLatestReading, {
        deviceId: args.deviceId,
      });

      const minThreshold = device.customMinMoisture ?? 30;

      if (m < minThreshold) {
        if (!latestReading || latestReading.moisture >= minThreshold) {
          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: m < minThreshold - 10 ? "alert" : "low_moisture",
            message: `⚠️ Low Moisture: ${m}% in ${device.name}. Irrigation recommended!`,
          });
        }
      }

      if (t > 40) {
        if (!latestReading || latestReading.temperature <= 40) {
          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "alert",
            message: `🔥 High Temp: ${t}°C in ${device.name}. Dangerous for crops!`,
          });
        }
      }

      let currentPumpStatus = p;

      if (p && f < 0.1) {
        if (
          latestReading &&
          latestReading.pumpStatus &&
          latestReading.flowRate < 0.1
        ) {
          currentPumpStatus = false;
          await ctx.runMutation(internal.readings.logEventInternal, {
            userId: device.userId,
            deviceId: args.deviceId,
            type: "pump_failure",
            message: `🚨 CRITICAL: Pump is running dry in ${device.name}! Auto-shutdown activated.`,
          });
          try {
            await fetch(`${url}/control/pump.json?auth=${secret}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(0),
            });
          } catch (e) {}
        } else {
          if (
            !latestReading ||
            latestReading.flowRate >= 0.1 ||
            !latestReading.pumpStatus
          ) {
            await ctx.runMutation(internal.readings.logEventInternal, {
              userId: device.userId,
              deviceId: args.deviceId,
              type: "alert",
              message: `🚫 Flow Alert: Pump is ON but no water flowing in ${device.name}!`,
            });
          }
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
          timestamp: Date.now(),
        });
      }
    } catch (error) {}
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
    const res = await fetch(
      `${device.firebaseUrl}/control/pump.json?auth=${device.firebaseSecret}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args.state ? 1 : 0),
      },
    );
    if (!res.ok) throw new Error("Failed to control pump");
    await ctx.runMutation(internal.readings.logPumpEvent, {
      userId: device.userId,
      deviceId: args.deviceId,
      state: args.state,
    });
    return { success: true };
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
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return await ctx.db
      .query("readings")
      .withIndex("by_device_timestamp", (q) =>
        q.eq("deviceId", args.deviceId).gte("timestamp", sevenDaysAgo),
      )
      .collect();
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
        message: `🚨 Test Alert: Check values (M:${m}%, T:${t}°C) in ${device.name}`,
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

    return `✅ Success: Planted ${count} readings across ${devices.length} devices!`;
  },
});
