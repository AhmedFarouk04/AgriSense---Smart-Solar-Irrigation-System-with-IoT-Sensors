import { mutation } from "./_generated/server";

export const fixOldDevices = mutation({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("devices").collect();
    const plants = await ctx.db.query("plants").collect();

    // نجلب أول محصول موجود في النظام كقيمة افتراضية
    let defaultPlantId = plants.length > 0 ? plants[0]._id : null;

    // لو مفيش أي محصول، نعمل واحد افتراضي عشان الـ Schema ميتكسرش
    if (!defaultPlantId) {
      defaultPlantId = await ctx.db.insert("plants", {
        name: "Default Plant",
        nameAr: "نبات افتراضي",
        minMoisture: 30,
        maxMoisture: 70,
        minSalinity: 0,
        maxSalinity: 2,
        optimalTemp: 25,
        description: "Fallback plant for migration",
      });
    }

    let count = 0;
    for (const device of devices) {
      const patch: any = {};
      if (device.plantId === undefined) patch.plantId = defaultPlantId;
      if (device.cropStartedAt === undefined)
        patch.cropStartedAt = device.createdAt || Date.now();

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(device._id, patch);
        count++;
      }
    }
    return `Migration successful! Fixed ${count} old devices.`;
  },
});
