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
// ضيف ده في آخر ملف convex/users.ts

export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});
