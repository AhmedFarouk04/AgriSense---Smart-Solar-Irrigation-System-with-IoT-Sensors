import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const updateUserProfile = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    farmArea: v.optional(v.number()),
    location: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, {
      name: args.name,
      phone: args.phone,
      farmArea: args.farmArea,
      location: args.location,
      role: args.role,
    });
    return { success: true };
  },
});

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return user;
  },
});

export const verifyEmail = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.verificationCode !== args.code) {
      throw new Error("Invalid verification code");
    }
    if (user.codeExpires && user.codeExpires < Date.now()) {
      throw new Error("Verification code expired");
    }
    await ctx.db.patch(userId, {
      emailVerificationTime: Date.now(),
      verificationCode: undefined,
      codeExpires: undefined,
    });
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
    if (user.emailVerificationTime) {
      throw new Error("Email already verified");
    }
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
