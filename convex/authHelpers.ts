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
      // ✅ بنرجع userExists: false عشان الـ frontend يعرف
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

// ✅ يتحقق من الكود فقط بدون ما يغير الباسورد — للـ Step 1 validation
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

    if (user.verificationCode !== code) {
      throw new Error("Invalid verification code");
    }

    if (user.codeExpires && user.codeExpires < Date.now()) {
      throw new Error("Verification code expired");
    }

    return { success: true };
  },
});

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

    if (user.verificationCode !== code) {
      throw new Error("Invalid verification code");
    }

    if (user.codeExpires && user.codeExpires < Date.now()) {
      throw new Error("Verification code expired");
    }

    await ctx.db.patch(user._id, {
      verificationCode: undefined,
      codeExpires: undefined,
    });

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
