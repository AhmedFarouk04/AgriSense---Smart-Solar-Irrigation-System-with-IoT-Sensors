import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// تصدير البيانات بصيغة CSV
export const exportToCSV = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const readings = await ctx.db
      .query("readings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1000);

    // تحويل البيانات إلى CSV
    const headers = ["التاريخ والوقت", "الرطوبة %", "الملوحة", "الحرارة °C", "حالة المضخة"];
    const rows = readings.map((r) => [
      new Date(r._creationTime).toLocaleString("ar-EG"),
      r.moisture,
      r.salinity.toFixed(1),
      r.temperature,
      r.pumpStatus ? "تعمل" : "متوقفة",
    ]);

    return {
      headers,
      rows,
      filename: `irrigation-data-${new Date().toISOString().split("T")[0]}.csv`,
    };
  },
});
