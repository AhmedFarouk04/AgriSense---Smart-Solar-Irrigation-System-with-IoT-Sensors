import { mutation, query } from "./_generated/server";

const SUPPORTED_CROPS = [
  {
    name: "Tomato",
    nameAr: "طماطم",
    minMoisture: 30,
    maxMoisture: 70,
    minSalinity: 1.0,
    maxSalinity: 2.5,
    optimalTemp: 25,
    description: "Requires consistent moisture.",
  },
  {
    name: "Cucumber",
    nameAr: "خيار",
    minMoisture: 40,
    maxMoisture: 80,
    minSalinity: 1.0,
    maxSalinity: 2.0,
    optimalTemp: 22,
    description: "High water demand.",
  },
  {
    name: "Bell Pepper",
    nameAr: "فلفل",
    minMoisture: 30,
    maxMoisture: 70,
    minSalinity: 1.0,
    maxSalinity: 2.0,
    optimalTemp: 26,
    description: "Needs warm soil.",
  },
  {
    name: "Eggplant",
    nameAr: "باذنجان",
    minMoisture: 30,
    maxMoisture: 70,
    minSalinity: 1.5,
    maxSalinity: 3.0,
    optimalTemp: 27,
    description: "Heavy feeder.",
  },
  {
    name: "Strawberry",
    nameAr: "فراولة",
    minMoisture: 35,
    maxMoisture: 75,
    minSalinity: 0.5,
    maxSalinity: 1.5,
    optimalTemp: 20,
    description: "Needs frequent watering.",
  },
  {
    name: "Potatoes",
    nameAr: "بطاطس",
    minMoisture: 20,
    maxMoisture: 60,
    minSalinity: 1.5,
    maxSalinity: 3.0,
    optimalTemp: 18,
    description: "Requires well-drained soil.",
  },
  {
    name: "Carrots",
    nameAr: "جزر",
    minMoisture: 25,
    maxMoisture: 60,
    minSalinity: 1.0,
    maxSalinity: 2.5,
    optimalTemp: 18,
    description: "Requires loose soil.",
  },
  {
    name: "Watermelon",
    nameAr: "بطيخ",
    minMoisture: 20,
    maxMoisture: 60,
    minSalinity: 1.5,
    maxSalinity: 4.0,
    optimalTemp: 28,
    description: "Deep roots.",
  },
  {
    name: "Onion",
    nameAr: "بصل",
    minMoisture: 20,
    maxMoisture: 55,
    minSalinity: 1.0,
    maxSalinity: 2.0,
    optimalTemp: 18,
    description: "Sensitive to overwatering.",
  },
  {
    name: "Lettuce",
    nameAr: "خس",
    minMoisture: 40,
    maxMoisture: 85,
    minSalinity: 1.0,
    maxSalinity: 2.0,
    optimalTemp: 16,
    description: "Needs cool soil.",
  },
] as const;

const SUPPORTED_CROP_NAMES: Set<string> = new Set(
  SUPPORTED_CROPS.map((crop) => crop.name),
);

export const getPlants = query({
  args: {},
  handler: async (ctx) => {
    const plants = await ctx.db.query("plants").collect();
    return plants
      .filter((plant) => SUPPORTED_CROP_NAMES.has(plant.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const seedPlants = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("plants").collect();
    const existingByName = new Map(existing.map((plant) => [plant.name, plant]));

    let inserted = 0;
    let updated = 0;
    let removed = 0;

    for (const crop of SUPPORTED_CROPS) {
      const current = existingByName.get(crop.name);
      if (current) {
        await ctx.db.patch(current._id, {
          nameAr: crop.nameAr,
          minMoisture: crop.minMoisture,
          maxMoisture: crop.maxMoisture,
          minSalinity: crop.minSalinity,
          maxSalinity: crop.maxSalinity,
          optimalTemp: crop.optimalTemp,
          description: crop.description,
        });
        updated++;
      } else {
        await ctx.db.insert("plants", crop);
        inserted++;
      }
    }

    for (const plant of existing) {
      if (!SUPPORTED_CROP_NAMES.has(plant.name)) {
        await ctx.db.delete(plant._id);
        removed++;
      }
    }

    return {
      message: "Plants synced with supported agronomy crops",
      supportedCount: SUPPORTED_CROPS.length,
      inserted,
      updated,
      removed,
    };
  },
});
