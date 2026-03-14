import {
  query,
  action,
  internalMutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getDeviceInternal = internalQuery({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deviceId);
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
      const [moistureRes, tempRes, flowRes, pumpRes] = await Promise.all([
        fetch(`${url}/sensor/moisture.json?auth=${secret}`),
        fetch(`${url}/sensor/air_temp.json?auth=${secret}`),
        fetch(`${url}/sensor/flow_rate.json?auth=${secret}`),
        fetch(`${url}/control/pump.json?auth=${secret}`),
      ]);

      const [moisture, temperature, flowRate, pumpRaw] = await Promise.all([
        moistureRes.json(),
        tempRes.json(),
        flowRes.json(),
        pumpRes.json(),
      ]);

      if (moisture === null || temperature === null || flowRate === null)
        return;

      const m = Math.min(100, Math.max(0, Number(moisture)));
      const t = Number(temperature);
      const f = Math.max(0, Number(flowRate));
      const p = pumpRaw === 1 || pumpRaw === true;

      if (isNaN(m) || isNaN(t) || isNaN(f)) return;

      await ctx.runMutation(internal.readings.saveReading, {
        userId: device.userId,
        deviceId: args.deviceId,
        moisture: m,
        temperature: t,
        flowRate: f,
        pumpStatus: p,
        timestamp: Date.now(),
      });
    } catch {
      return;
    }
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
  args: {
    deviceId: v.id("devices"),
    state: v.boolean(),
  },
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
