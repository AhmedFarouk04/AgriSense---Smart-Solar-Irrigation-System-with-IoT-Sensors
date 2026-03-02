// convex/authHelpers.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!user) {
      return { success: false, userExists: false };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000;

    await ctx.db.patch(user._id, {
      verificationCode: resetCode,
      codeExpires: expires,
    });

    await ctx.scheduler.runAfter(0, internal.email.sendPasswordResetEmail, {
      email: user.email!,
      code: resetCode,
    });

    return { success: true, userExists: true };
  },
});

export const verifyResetCode = mutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, code } = args;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!user) throw new Error("User not found");
    if (user.verificationCode !== code)
      throw new Error("Invalid verification code");
    if (user.codeExpires && user.codeExpires < Date.now())
      throw new Error("Verification code expired");

    return { success: true };
  },
});

// ✅ resetPassword النهائي
// ✅ resetPassword - يستدعي action مش mutation
export const resetPassword = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, code, newPassword } = args;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!user) throw new Error("User not found");
    if (user.verificationCode !== code) throw new Error("Invalid code");
    if (user.codeExpires && user.codeExpires < Date.now())
      throw new Error("Code expired");

    // مسح الكود
    await ctx.db.patch(user._id, {
      verificationCode: undefined,
      codeExpires: undefined,
    });

    // ✅ امسح كل الـ sessions بتاعت المستخدم
    // ✅ امسح الـ sessions أولاً
    const sessions = await ctx.db
      .query("authSessions")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    for (const session of sessions) {
      // امسح الـ refresh tokens المرتبطة بالـ session دي
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .filter((q) => q.eq(q.field("sessionId"), session._id))
        .collect();

      for (const token of tokens) {
        await ctx.db.delete(token._id);
      }

      await ctx.db.delete(session._id);
    }
    // تحديث الباسورد
    await ctx.scheduler.runAfter(0, internal.password.updatePassword, {
      userId: user._id,
      newPassword: newPassword,
    });

    console.log("✅ [authHelpers] Password reset + sessions cleared");
    return { success: true };
  },
});

export const resendVerificationCode = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!user) throw new Error("User not found");

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    await ctx.db.patch(user._id, {
      verificationCode: newCode,
      codeExpires: expires,
    });

    await ctx.scheduler.runAfter(0, internal.email.sendVerificationEmail, {
      email: user.email!,
      code: newCode,
    });

    return { success: true };
  },
});
