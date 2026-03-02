import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const readings = await ctx.db
      .query("readings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);

    return readings[0] || null;
  },
});

export const getHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("readings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);
  },
});

export const create = mutation({
  args: {
    moisture: v.number(),
    salinity: v.number(),
    temperature: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("يجب تسجيل الدخول أولاً");
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    let pumpStatus = false;
    let autoTriggered = false;

    if (settings?.manualMode) {
      pumpStatus = settings.pumpManualStatus;
    } else {
      if (settings?.selectedPlantId) {
        const plant = await ctx.db.get(settings.selectedPlantId);
        if (plant) {
          if (args.moisture < plant.minMoisture) {
            pumpStatus = true;
            autoTriggered = true;

            await ctx.db.insert("events", {
              userId,
              type: "pump_on",
              message: `تم تشغيل المضخة تلقائياً - الرطوبة منخفضة (${args.moisture}%)`,
              data: { moisture: args.moisture, threshold: plant.minMoisture },
            });
          }

          if (args.salinity > plant.maxSalinity) {
            await ctx.db.insert("events", {
              userId,
              type: "alert",
              message: `تحذير: نسبة الملوحة مرتفعة (${args.salinity})`,
              data: { salinity: args.salinity, max: plant.maxSalinity },
            });
          }

          const tempDiff = Math.abs(args.temperature - plant.optimalTemp);
          if (tempDiff > 5) {
            await ctx.db.insert("events", {
              userId,
              type: "alert",
              message: `تحذير: درجة الحرارة ${args.temperature > plant.optimalTemp ? "مرتفعة" : "منخفضة"} (${args.temperature}°C)`,
              data: {
                temperature: args.temperature,
                optimal: plant.optimalTemp,
              },
            });
          }
        }
      }
    }

    return await ctx.db.insert("readings", {
      userId,
      moisture: args.moisture,
      salinity: args.salinity,
      temperature: args.temperature,
      pumpStatus,
      autoTriggered,
    });
  },
});

export const simulate = mutation({
  args: {},
  handler: async (ctx): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("يجب تسجيل الدخول أولاً");
    }

    const moisture = Math.floor(Math.random() * 40) + 40; // 40-80%
    const salinity = Math.random() * 3 + 1; // 1-4
    const temperature = Math.floor(Math.random() * 15) + 15; // 15-30°C

    return await ctx.runMutation(api.readings.create, {
      moisture,
      salinity,
      temperature,
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const allReadings = await ctx.db
      .query("readings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);

    if (allReadings.length === 0) {
      return {
        totalReadings: 0,
        avgMoisture: 0,
        avgSalinity: 0,
        avgTemperature: 0,
        pumpActivations: 0,
      };
    }

    const avgMoisture =
      allReadings.reduce((sum, r) => sum + r.moisture, 0) / allReadings.length;
    const avgSalinity =
      allReadings.reduce((sum, r) => sum + r.salinity, 0) / allReadings.length;
    const avgTemperature =
      allReadings.reduce((sum, r) => sum + r.temperature, 0) /
      allReadings.length;
    const pumpActivations = allReadings.filter((r) => r.pumpStatus).length;

    return {
      totalReadings: allReadings.length,
      avgMoisture: Math.round(avgMoisture * 10) / 10,
      avgSalinity: Math.round(avgSalinity * 10) / 10,
      avgTemperature: Math.round(avgTemperature * 10) / 10,
      pumpActivations,
    };
  },
});
