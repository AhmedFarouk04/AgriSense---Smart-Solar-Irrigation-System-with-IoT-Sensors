import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      return null;
    }

    const plant = settings.selectedPlantId
      ? await ctx.db.get(settings.selectedPlantId)
      : null;

    return { ...settings, plant };
  },
});

export const createDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("يجب تسجيل الدخول أولاً");
    }

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("userSettings", {
      userId,
      manualMode: false,
      pumpManualStatus: false,
    });
  },
});

export const updatePlant = mutation({
  args: { plantId: v.optional(v.id("plants")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("يجب تسجيل الدخول أولاً");
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (settings) {
      await ctx.db.patch(settings._id, { selectedPlantId: args.plantId });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        selectedPlantId: args.plantId,
        manualMode: false,
        pumpManualStatus: false,
      });
    }

    await ctx.db.insert("events", {
      userId,
      type: "settings_change",
      message: args.plantId ? "تم تغيير نوع النبات" : "تم إلغاء اختيار النبات",
    });
  },
});

export const toggleManualMode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("يجب تسجيل الدخول أولاً");
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      throw new ConvexError("الإعدادات غير موجودة");
    }

    const newManualMode = !settings.manualMode;
    await ctx.db.patch(settings._id, { manualMode: newManualMode });

    await ctx.db.insert("events", {
      userId,
      type: "mode_change",
      message: newManualMode
        ? "تم التبديل إلى الوضع اليدوي"
        : "تم التبديل إلى الوضع التلقائي",
    });

    return newManualMode;
  },
});

export const togglePumpManual = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("يجب تسجيل الدخول أولاً");
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      throw new ConvexError("الإعدادات غير موجودة");
    }

    if (!settings.manualMode) {
      throw new ConvexError("يجب تفعيل الوضع اليدوي أولاً");
    }

    const newStatus = !settings.pumpManualStatus;
    await ctx.db.patch(settings._id, { pumpManualStatus: newStatus });

    await ctx.db.insert("events", {
      userId,
      type: newStatus ? "pump_on" : "pump_off",
      message: newStatus ? "تم تشغيل المضخة يدوياً" : "تم إيقاف المضخة يدوياً",
    });

    return newStatus;
  },
});
