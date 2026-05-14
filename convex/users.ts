import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const checkEmailExists = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    return user !== null && user.emailVerificationTime !== undefined;
  },
});

export const checkNameExists = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    return user !== null && user.emailVerificationTime !== undefined;
  },
});

export const verifyEmail = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.verificationCode !== args.code)
      throw new Error("Invalid verification code");
    if (user.codeExpires && user.codeExpires < Date.now())
      throw new Error("Verification code expired");

    await ctx.db.patch(userId, {
      emailVerificationTime: Date.now(),
      verificationCode: undefined,
      codeExpires: undefined,
    });
    return { success: true };
  },
});

export const saveUserName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { name: args.name });
    return { success: true };
  },
});

export const sendVerificationCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.emailVerificationTime) throw new Error("Email already verified");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    await ctx.db.patch(userId, {
      verificationCode: code,
      codeExpires: expires,
    });
    await ctx.scheduler.runAfter(0, internal.email.sendVerificationEmail, {
      email: user.email!,
      code,
    });
    return { success: true };
  },
});

// ==========================================
// Profile & Settings
// ==========================================

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateUserProfile = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    farmName: v.optional(v.string()),
    farmArea: v.optional(v.number()),
    farmAreaUnit: v.optional(v.string()),
    location: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.patch(userId, args);
    return { success: true };
  },
});

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const updateSettings = mutation({
  args: {
    notificationsEnabled: v.optional(v.boolean()),
    theme: v.optional(v.string()),
    language: v.optional(v.string()),
    escalationDelayMinutes: v.optional(v.number()),
    externalAlertsEnabled: v.optional(v.boolean()),
    externalAlertEmail: v.optional(v.string()),
    externalAlertPhone: v.optional(v.string()),
    externalAlertWhatsapp: v.optional(v.string()),
    pushWebhookUrl: v.optional(v.string()),
    lastNotificationsViewedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        manualMode: false,
        pumpManualStatus: false,
        ...args,
      });
    }
  },
});

export function cleanEventDataForUI(event: any) {
  const e = { ...event };

  // Preserve suppressToast flag before stripping internal data for the UI
  if (e.data && e.data.suppressToast) {
    e.suppressToast = true;
  }

  if (e.data) {
    const d = { ...e.data };
    const isInitial =
      d.source === "zone_created" || d.displayMode === "in_app_only";

    // 1. إخفاء الـ Internal Metadata بالكامل
    const internalKeys = [
      "source",
      "suppressToast",
      "displayMode",
      "skipEscalation",
      "nextCheckAt",
      "sessionId",
      "sourceEventId",
      "sourceType",
      "actionTaken",
      "nextAction",
      "target",
      "zoneAreaM2",
      "safetyMode",
      "nutrients",
      "nutrientSummary",
      "weekNumber",
      "weeksLabel",
    ];
    for (const key of internalKeys) delete d[key];

    // 2. معالجة القراءات المبدئية
    if (isInitial) {
      if (d.moisture === 0) d.moisture = "Waiting for sensor data";
      if (d.flowRate === 0) d.flowRate = "Waiting for sensor data";
      if (d.temperature === 0) d.temperature = "Waiting for sensor data";
    } else {
      if (typeof d.moisture === "number") d.moisture = `${d.moisture}%`;
      if (typeof d.flowRate === "number") d.flowRate = `${d.flowRate} L/min`;
      if (typeof d.temperature === "number")
        d.temperature = `${d.temperature}°C`;
    }

    // 3. تنسيق التواريخ
    const formatDate = (ts: number) =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(ts));

    const readableData: Record<string, any> = {};
    for (const [k, v] of Object.entries(d)) {
      if (v === undefined || v === null) continue;

      let newKey = k;
      let newValue = v;

      if (k === "lastIrrigationAt") {
        newKey = "Last Irrigation";
        newValue =
          v === "none" || v === 0
            ? "No irrigation sessions yet"
            : formatDate(v as number);
      } else if (k === "nextIrrigationAt") {
        newKey = "Next Irrigation";
        newValue = formatDate(v as number);
      } else if (k === "nextReviewAt") {
        newKey = "Next Review";
        newValue = formatDate(v as number);
      } else if (k === "wateringFrequency" || k === "wateringCadence") {
        newKey = "Watering Cadence";
      } else if (k === "criticalRemarks" || k === "remarks") {
        newKey = "Remarks";
      } else if (k === "applicationTiming" || k === "phase") {
        newKey = "Phase";
      } else if (k === "weeksLabel" || k === "weekRange") {
        newKey = "Week Range";
      } else if (k === "weekNumber") {
        newKey = "Week Number";
      } else if (k === "nextPhase") {
        newKey = "Next Phase";
      } else if (k === "nutrientKgPerFed" || k === "doseKgPerFed") {
        newKey = "Dose (kg/fed)";
        const nv = v as any;
        newValue = `N:${nv.nitrogen} P:${nv.phosphorus} K:${nv.potassium} Ca:${nv.calcium} Mg:${nv.magnesium}`;
      } else if (k === "zoneDoseKg") {
        newKey = "Zone Dose (kg)";
        const nv = v as any;
        newValue = `N:${nv.nitrogen} P:${nv.phosphorus} K:${nv.potassium} Ca:${nv.calcium} Mg:${nv.magnesium}`;
      } else if (k === "runtimeMinutes") {
        newKey = "Runtime (min)";
      } else if (k.endsWith("At") && typeof v === "number") {
        newKey =
          k.charAt(0).toUpperCase() +
          k
            .slice(1, -2)
            .replace(/([A-Z])/g, " $1")
            .trim();
        newValue = formatDate(v as number);
      } else if (k === "moisture" || k === "temperature" || k === "flowRate") {
        newKey =
          k.charAt(0).toUpperCase() +
          k
            .slice(1)
            .replace(/([A-Z])/g, " $1")
            .trim();
      } else {
        newKey =
          k.charAt(0).toUpperCase() +
          k
            .slice(1)
            .replace(/([A-Z])/g, " $1")
            .trim();
      }

      readableData[newKey] = newValue;
    }

    e.data = Object.keys(readableData).length > 0 ? readableData : undefined;
  }
  return e;
}

export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);

    return events.map(cleanEventDataForUI);
  },
});

export const markNotificationsViewed = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const now = Date.now();
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastNotificationsViewedAt: now,
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        manualMode: false,
        pumpManualStatus: false,
        lastNotificationsViewedAt: now,
      });
    }
    return { success: true, viewedAt: now };
  },
});
export const clearEvents = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
  },
});
