// convex/auth.ts
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      console.log("🔵 [auth.ts] afterUserCreatedOrUpdated called", {
        userId,
        existingUserId,
        timestamp: new Date().toISOString(),
      });

      const user = await ctx.db.get(userId);

      if (!existingUserId) {
        if (user?.email && !user?.emailVerificationTime) {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const expires = Date.now() + 5 * 60 * 1000;

          await ctx.db.patch(userId, {
            verificationCode: code,
            codeExpires: expires,
          });

          await ctx.scheduler.runAfter(
            0,
            internal.email.sendVerificationEmail,
            { email: user.email, code },
          );
        }
      }
    },
  },
});

export const loggedInUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return (user as any)?.role || "farmer";
  },
});

export const verifyEmailCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (user.emailVerificationTime) {
      return { success: true };
    }

    if (!user.verificationCode || user.verificationCode !== args.code) {
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

export const resendVerificationCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("User not found");
    if (user.emailVerificationTime) throw new Error("Email already verified");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    await ctx.db.patch(userId, {
      verificationCode: code,
      codeExpires: expires,
    });

    await ctx.scheduler.runAfter(0, internal.email.sendVerificationEmail, {
      email: user.email,
      code,
    });

    return { success: true };
  },
});

// ✅ دالة تغيير الباسورد - من غير withIndex
export const changePassword = internalMutation({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, newPassword } = args;

    // نجيب كل accounts المستخدم
    const accounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // نلاقي account الباسورد
    const passwordAccount = accounts.find((acc) => acc.provider === "password");

    if (!passwordAccount) {
      throw new Error("No password account found");
    }

    // Convex Auth هيتولى التشفير لوحده
    await ctx.db.patch(passwordAccount._id, {
      secret: newPassword,
    });

    return { success: true };
  },
});
