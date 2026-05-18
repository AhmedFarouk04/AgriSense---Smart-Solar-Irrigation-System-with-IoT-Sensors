import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function assertValidInitialWeek(initialCropWeek?: number) {
  if (initialCropWeek === undefined) return;
  if (!Number.isFinite(initialCropWeek)) throw new Error("Invalid crop week");
  if (initialCropWeek < 1 || initialCropWeek > 104) {
    throw new Error("Crop week must be between 1 and 104");
  }
}

function toCropStartedAt(initialCropWeek: number) {
  return Date.now() - (Math.floor(initialCropWeek) - 1) * WEEK_MS;
}

export const addDevice = mutation({
  args: {
    name: v.string(),
    firebaseUrl: v.string(),
    firebaseSecret: v.string(),
    plantId: v.id("plants"),
    initialCropWeek: v.number(),
    areaM2: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const trimmedName = args.name.trim();
    const trimmedUrl = args.firebaseUrl.trim().replace(/\/$/, "");
    const trimmedSecret = args.firebaseSecret.trim();

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50)
      throw new Error("Zone name must be between 2 and 50 characters");

    if (
      !trimmedUrl.startsWith("https://") ||
      !trimmedUrl.includes("firebasedatabase.app")
    )
      throw new Error("Invalid Firebase URL");

    if (!trimmedSecret || trimmedSecret.length < 10)
      throw new Error("Invalid Firebase secret");
    assertValidInitialWeek(args.initialCropWeek);

    const existing = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // 1. Unique check is ONLY on the Zone Name (firebaseUrl can be reused)
    if (
      existing.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase())
    )
      throw new Error("A zone with this name already exists");

    const createdAt = Date.now();
    const cropStartedAt = toCropStartedAt(args.initialCropWeek);

    // 2. Insert exactly matching the schema fields
    const deviceId = await ctx.db.insert("devices", {
      userId,
      name: trimmedName,
      firebaseUrl: trimmedUrl,
      firebaseSecret: trimmedSecret,
      plantId: args.plantId,
      isActive: true,
      createdAt,
      cropStartedAt,
      areaM2: args.areaM2,
      notes: args.notes,
    });

    await ctx.db.insert("events", {
      userId,
      deviceId,
      type: "device_added",
      message: `Zone "${trimmedName}" was added${args.initialCropWeek ? ` (crop starts at week ${Math.floor(args.initialCropWeek)})` : ""}.`,
      data: {
        cropWeekAtSetup: args.initialCropWeek
          ? Math.floor(args.initialCropWeek)
          : undefined,
        cropStartedAt,
        source: "zone_created",
        suppressToast: true,
        displayMode: "in_app_only",
      },
      timestamp: createdAt,
    });

    await ctx.scheduler.runAfter(0, internal.readings.pollDevice, {
      deviceId,
    });

    return { success: true, deviceId };
  },
});

export const checkDeviceName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const trimmedName = args.name.trim().toLowerCase();
    if (!trimmedName) return false;
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return existing.some((d) => d.name.toLowerCase() === trimmedName);
  },
});

export const getDevices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return devices.map(({ firebaseSecret, ...rest }) => rest);
  },
});

export const getDevice = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId)
      throw new Error("Device not found");

    return device;
  },
});

export const updateDevice = mutation({
  args: {
    deviceId: v.id("devices"),
    name: v.optional(v.string()),
    plantId: v.optional(v.id("plants")),
    isActive: v.optional(v.boolean()),
    // ✅ per-device thresholds
    customMinMoisture: v.optional(v.number()),
    customMaxMoisture: v.optional(v.number()),
    customOptimalTemp: v.optional(v.number()),
    initialCropWeek: v.optional(v.number()),

    areaM2: v.optional(v.number()),
    notes: v.optional(v.string()),
    isSimulationMode: v.optional(v.boolean()),
    freezeSimulationReadings: v.optional(v.boolean()),
    simulationMoisture: v.optional(v.number()),
    simulationTemperature: v.optional(v.number()),
    simulationFlowRate: v.optional(v.number()),
    simulationPumpStatus: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId)
      throw new Error("Device not found");
    assertValidInitialWeek(args.initialCropWeek);

    const patch: any = {};

    if (args.name !== undefined) {
      const trimmed = args.name.trim();
      if (!trimmed || trimmed.length < 2 || trimmed.length > 50)
        throw new Error("Zone name must be between 2 and 50 characters");
      patch.name = trimmed;
    }

    if (args.plantId !== undefined) patch.plantId = args.plantId;
    if (args.isActive !== undefined) patch.isActive = args.isActive;
    if (args.customMinMoisture !== undefined)
      patch.customMinMoisture = args.customMinMoisture;
    if (args.customMaxMoisture !== undefined)
      patch.customMaxMoisture = args.customMaxMoisture;
    if (args.customOptimalTemp !== undefined)
      patch.customOptimalTemp = args.customOptimalTemp;
    if (args.initialCropWeek !== undefined)
      patch.cropStartedAt = toCropStartedAt(args.initialCropWeek);
    if (args.areaM2 !== undefined) patch.areaM2 = args.areaM2;
    if (args.notes !== undefined) patch.notes = args.notes;
    if (args.isSimulationMode !== undefined)
      patch.isSimulationMode = args.isSimulationMode;
    if (args.freezeSimulationReadings !== undefined)
      patch.freezeSimulationReadings = args.freezeSimulationReadings;
    if (args.simulationMoisture !== undefined)
      patch.simulationMoisture = args.simulationMoisture;
    if (args.simulationTemperature !== undefined)
      patch.simulationTemperature = args.simulationTemperature;
    if (args.simulationFlowRate !== undefined)
      patch.simulationFlowRate = args.simulationFlowRate;
    if (args.simulationPumpStatus !== undefined)
      patch.simulationPumpStatus = args.simulationPumpStatus;

    // Leaving simulation mode should restore normal live polling behavior immediately.
    if (args.isSimulationMode === false) {
      patch.freezeSimulationReadings = false;
      patch.simulationMoisture = undefined;
      patch.simulationTemperature = undefined;
      patch.simulationFlowRate = undefined;
      patch.simulationPumpStatus = undefined;
      patch.testOverrideUntil = undefined;
    }

    await ctx.db.patch(args.deviceId, patch);

    if (args.isActive !== undefined && args.isActive !== device.isActive) {
      await ctx.db.insert("events", {
        userId,
        deviceId: args.deviceId,
        type: "zone_status",
        message: `Zone \"${patch.name ?? device.name}\" was ${args.isActive ? "activated" : "paused"}.`,
        timestamp: Date.now(),
      });
    }

    if (args.isActive === true && !device.isActive) {
      await ctx.scheduler.runAfter(0, internal.readings.pollDevice, {
        deviceId: args.deviceId,
      });
    }

    return { success: true };
  },
});

export const deleteDevice = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId)
      throw new Error("Device not found");

    const readings = await ctx.db
      .query("readings")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .collect();
    for (const r of readings) await ctx.db.delete(r._id);

    const events = await ctx.db
      .query("events")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .collect();
    for (const e of events) await ctx.db.delete(e._id);

    await ctx.db.delete(args.deviceId);
    return { success: true };
  },
});

export const testConnection = action({
  args: {
    firebaseUrl: v.string(),
    firebaseSecret: v.string(),
  },
  handler: async (_, args) => {
    const url = args.firebaseUrl.trim().replace(/\/$/, "");
    const secret = args.firebaseSecret.trim();

    try {
      const res = await fetch(`${url}/sensor/moisture.json?auth=${secret}`);

      if (!res.ok)
        return {
          success: false,
          error: "Connection failed. Check your URL and secret.",
        };

      const data = await res.json();

      if (data === null)
        return {
          success: true,
          warning: "Connected but no sensor data found yet.",
        };

      return { success: true };
    } catch {
      return {
        success: false,
        error: "Could not reach Firebase. Check the URL.",
      };
    }
  },
});
