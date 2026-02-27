import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// الحصول على جميع الأحداث للتقرير
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);
  },
});
