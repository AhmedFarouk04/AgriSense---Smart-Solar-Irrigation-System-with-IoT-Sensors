import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

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
    // ✅ بعد ما الحساب يتعمل، نبعت الكود تلقائياً
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      // نبعت كود بس لما الحساب جديد (مش update)
      if (!existingUserId) {
        const user = await ctx.db.get(userId);
        // لو مش verified (emailVerificationTime = undefined)
        if (user?.email && !user?.emailVerificationTime) {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const expires = Date.now() + 5 * 60 * 1000; // 5 دقايق

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

// ✅ mutation للـ verify
export const verifyEmailCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // ✅ لو already verified نرجع success
    if (user.emailVerificationTime) {
      return { success: true };
    }

    if (!user.verificationCode || user.verificationCode !== args.code) {
      throw new Error("Invalid verification code");
    }

    if (user.codeExpires && user.codeExpires < Date.now()) {
      throw new Error("Verification code expired");
    }

    // ✅ كود صح → نحط timestamp في emailVerificationTime ونمسح الكود
    await ctx.db.patch(userId, {
      emailVerificationTime: Date.now(),
      verificationCode: undefined,
      codeExpires: undefined,
    });

    return { success: true };
  },
});

// ✅ resend code
export const resendVerificationCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("User not found");

    // ✅ لو already verified منرسلش كود
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
      email: user.email,
      code,
    });

    return { success: true };
  },
});
