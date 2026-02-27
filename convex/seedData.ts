import { mutation } from "./_generated/server";

export const seedPlants = mutation({
  args: {},
  handler: async (ctx) => {
    const plants = [
      {
        name: "Tomato",
        nameAr: "طماطم",
        minMoisture: 60,
        maxMoisture: 80,
        minSalinity: 1.5,
        maxSalinity: 2.5,
        optimalTemp: 25,
        description: "نبات الطماطم يحتاج لرطوبة معتدلة وملوحة منخفضة",
      },
      {
        name: "Cucumber",
        nameAr: "خيار",
        minMoisture: 70,
        maxMoisture: 85,
        minSalinity: 1.0,
        maxSalinity: 2.0,
        optimalTemp: 24,
        description: "الخيار يحتاج لرطوبة عالية وملوحة منخفضة جداً",
      },
      {
        name: "Pepper",
        nameAr: "فلفل",
        minMoisture: 55,
        maxMoisture: 75,
        minSalinity: 1.5,
        maxSalinity: 3.0,
        optimalTemp: 26,
        description: "الفلفل يتحمل الملوحة المتوسطة ويحتاج رطوبة معتدلة",
      },
      {
        name: "Lettuce",
        nameAr: "خس",
        minMoisture: 65,
        maxMoisture: 80,
        minSalinity: 1.0,
        maxSalinity: 1.8,
        optimalTemp: 18,
        description: "الخس يحتاج لرطوبة عالية وملوحة منخفضة ودرجة حرارة باردة",
      },
      {
        name: "Wheat",
        nameAr: "قمح",
        minMoisture: 50,
        maxMoisture: 70,
        minSalinity: 2.0,
        maxSalinity: 4.0,
        optimalTemp: 20,
        description: "القمح يتحمل الملوحة المتوسطة ويحتاج رطوبة معتدلة",
      },
      {
        name: "Corn",
        nameAr: "ذرة",
        minMoisture: 55,
        maxMoisture: 75,
        minSalinity: 1.5,
        maxSalinity: 3.5,
        optimalTemp: 27,
        description: "الذرة تحتاج لرطوبة معتدلة وتتحمل الملوحة المتوسطة",
      },
    ];

    for (const plant of plants) {
      await ctx.db.insert("plants", plant);
    }

    return { success: true, count: plants.length };
  },
});
