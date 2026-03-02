import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const patchAccountSecret = internalMutation({
  args: {
    userId: v.id("users"),
    hashedPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const passwordAccount = accounts.find((acc) => acc.provider === "password");
    if (!passwordAccount) throw new Error("No password account found");

    // ✅ بدون أي prefix
    await ctx.db.patch(passwordAccount._id, {
      secret: args.hashedPassword,
    });

    return { success: true };
  },
});
