import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const FERTILIZER_SCHEDULE_DATA = [
  {
    "cropName": "Tomato",
    "weeksLabel": "Week 1-3",
    "startWeek": 1,
    "endWeek": 3,
    "applicationTiming": "Establishment",
    "nitrogenKgPerFed": 15.0,
    "phosphorusKgPerFed": 20.0,
    "potassiumKgPerFed": 10.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Focus on root development"
  },
  {
    "cropName": "Tomato",
    "weeksLabel": "Week 4",
    "startWeek": 4,
    "endWeek": 4,
    "applicationTiming": "Stressing Period",
    "nitrogenKgPerFed": 5.0,
    "phosphorusKgPerFed": 30.0,
    "potassiumKgPerFed": 10.0,
    "calciumKgPerFed": 0.0,
    "magnesiumKgPerFed": 0.0,
    "criticalRemarks": "High Phosphorus (W4) for rooting as per image"
  },
  {
    "cropName": "Tomato",
    "weeksLabel": "Week 5-7",
    "startWeek": 5,
    "endWeek": 7,
    "applicationTiming": "Vegetative Growth",
    "nitrogenKgPerFed": 25.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 20.0,
    "calciumKgPerFed": 10.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Balanced growth before fruit set"
  },
  {
    "cropName": "Tomato",
    "weeksLabel": "Week 8-12",
    "startWeek": 8,
    "endWeek": 12,
    "applicationTiming": "Fruit Set (Critical)",
    "nitrogenKgPerFed": 20.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 40.0,
    "calciumKgPerFed": 15.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "High Potassium (W8+) for fruit quality"
  },
  {
    "cropName": "Tomato",
    "weeksLabel": "Week 13+",
    "startWeek": 13,
    "endWeek": null,
    "applicationTiming": "Harvesting",
    "nitrogenKgPerFed": 10.0,
    "phosphorusKgPerFed": 5.0,
    "potassiumKgPerFed": 30.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Maintain fruit size and taste"
  },
  {
    "cropName": "Cucumber",
    "weeksLabel": "Week 1-3",
    "startWeek": 1,
    "endWeek": 3,
    "applicationTiming": "Early Growth",
    "nitrogenKgPerFed": 20.0,
    "phosphorusKgPerFed": 20.0,
    "potassiumKgPerFed": 20.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Balanced NPK starts here"
  },
  {
    "cropName": "Cucumber",
    "weeksLabel": "Week 4-End",
    "startWeek": 4,
    "endWeek": null,
    "applicationTiming": "Continuous Fruiting",
    "nitrogenKgPerFed": 30.0,
    "phosphorusKgPerFed": 15.0,
    "potassiumKgPerFed": 30.0,
    "calciumKgPerFed": 10.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Balanced NPK every 2 weeks as per image"
  },
  {
    "cropName": "Bell Pepper",
    "weeksLabel": "Week 1-4",
    "startWeek": 1,
    "endWeek": 4,
    "applicationTiming": "Early Growth",
    "nitrogenKgPerFed": 15.0,
    "phosphorusKgPerFed": 20.0,
    "potassiumKgPerFed": 15.0,
    "calciumKgPerFed": 10.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Establishment phase"
  },
  {
    "cropName": "Bell Pepper",
    "weeksLabel": "Week 5",
    "startWeek": 5,
    "endWeek": 5,
    "applicationTiming": "Light Stress",
    "nitrogenKgPerFed": 5.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 5.0,
    "calciumKgPerFed": 0.0,
    "magnesiumKgPerFed": 0.0,
    "criticalRemarks": "Stress week for root depth"
  },
  {
    "cropName": "Bell Pepper",
    "weeksLabel": "Week 6-9",
    "startWeek": 6,
    "endWeek": 9,
    "applicationTiming": "Vegetative",
    "nitrogenKgPerFed": 20.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 20.0,
    "calciumKgPerFed": 15.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Calcium-rich fertilizer to prevent rot"
  },
  {
    "cropName": "Bell Pepper",
    "weeksLabel": "Week 10-14",
    "startWeek": 10,
    "endWeek": 14,
    "applicationTiming": "Fruiting (Critical)",
    "nitrogenKgPerFed": 15.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 35.0,
    "calciumKgPerFed": 20.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Focus on Calcium and Potassium"
  },
  {
    "cropName": "Eggplant",
    "weeksLabel": "Week 1-2",
    "startWeek": 1,
    "endWeek": 2,
    "applicationTiming": "Establishment",
    "nitrogenKgPerFed": 10.0,
    "phosphorusKgPerFed": 20.0,
    "potassiumKgPerFed": 10.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Initial rooting"
  },
  {
    "cropName": "Eggplant",
    "weeksLabel": "Week 3",
    "startWeek": 3,
    "endWeek": 3,
    "applicationTiming": "Vegetative Start",
    "nitrogenKgPerFed": 30.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 15.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "High Nitrogen (W3) as per image"
  },
  {
    "cropName": "Eggplant",
    "weeksLabel": "Week 4-9",
    "startWeek": 4,
    "endWeek": 9,
    "applicationTiming": "Growth & Flowering",
    "nitrogenKgPerFed": 20.0,
    "phosphorusKgPerFed": 15.0,
    "potassiumKgPerFed": 25.0,
    "calciumKgPerFed": 10.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Prepare for maturation"
  },
  {
    "cropName": "Eggplant",
    "weeksLabel": "Week 10-15",
    "startWeek": 10,
    "endWeek": 15,
    "applicationTiming": "Maturation (Critical)",
    "nitrogenKgPerFed": 15.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 45.0,
    "calciumKgPerFed": 10.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Potassium (W10) for fruit sizing"
  },
  {
    "cropName": "Strawberry",
    "weeksLabel": "Week 1-3",
    "startWeek": 1,
    "endWeek": 3,
    "applicationTiming": "Establishment",
    "nitrogenKgPerFed": 10.0,
    "phosphorusKgPerFed": 15.0,
    "potassiumKgPerFed": 10.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Runner establishment"
  },
  {
    "cropName": "Strawberry",
    "weeksLabel": "Week 4-9",
    "startWeek": 4,
    "endWeek": 9,
    "applicationTiming": "Growth",
    "nitrogenKgPerFed": 15.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 20.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Organic liquid supplements"
  },
  {
    "cropName": "Strawberry",
    "weeksLabel": "Week 10-14",
    "startWeek": 10,
    "endWeek": 14,
    "applicationTiming": "Blooming (Critical)",
    "nitrogenKgPerFed": 10.0,
    "phosphorusKgPerFed": 5.0,
    "potassiumKgPerFed": 30.0,
    "calciumKgPerFed": 10.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Weekly liquid organic fertilizer in W10+"
  },
  {
    "cropName": "Potatoes",
    "weeksLabel": "Week 1-5",
    "startWeek": 1,
    "endWeek": 5,
    "applicationTiming": "Sprouting",
    "nitrogenKgPerFed": 20.0,
    "phosphorusKgPerFed": 30.0,
    "potassiumKgPerFed": 20.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Focus on P for roots"
  },
  {
    "cropName": "Potatoes",
    "weeksLabel": "Week 6-12",
    "startWeek": 6,
    "endWeek": 12,
    "applicationTiming": "Tuber Bulking",
    "nitrogenKgPerFed": 10.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 50.0,
    "calciumKgPerFed": 10.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Low N, High Potassium (W6) as per image"
  },
  {
    "cropName": "Potatoes",
    "weeksLabel": "Week 15+",
    "startWeek": 15,
    "endWeek": null,
    "applicationTiming": "Curing",
    "nitrogenKgPerFed": 0.0,
    "phosphorusKgPerFed": 0.0,
    "potassiumKgPerFed": 0.0,
    "calciumKgPerFed": 0.0,
    "magnesiumKgPerFed": 0.0,
    "criticalRemarks": "Stop watering and fertilizing to cure skin"
  },
  {
    "cropName": "Carrots",
    "weeksLabel": "Week 1-3",
    "startWeek": 1,
    "endWeek": 3,
    "applicationTiming": "Germination",
    "nitrogenKgPerFed": 5.0,
    "phosphorusKgPerFed": 15.0,
    "potassiumKgPerFed": 5.0,
    "calciumKgPerFed": 2.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Consistent misting, low Nitrogen"
  },
  {
    "cropName": "Carrots",
    "weeksLabel": "Week 4-12",
    "startWeek": 4,
    "endWeek": 12,
    "applicationTiming": "Root Expansion",
    "nitrogenKgPerFed": 10.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 30.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Low Nitrogen to avoid hairy roots"
  },
  {
    "cropName": "Watermelon",
    "weeksLabel": "Week 1-5",
    "startWeek": 1,
    "endWeek": 5,
    "applicationTiming": "Vine Growth",
    "nitrogenKgPerFed": 25.0,
    "phosphorusKgPerFed": 15.0,
    "potassiumKgPerFed": 15.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Heavy watering stages"
  },
  {
    "cropName": "Watermelon",
    "weeksLabel": "Week 6",
    "startWeek": 6,
    "endWeek": 6,
    "applicationTiming": "Fruit Init.",
    "nitrogenKgPerFed": 10.0,
    "phosphorusKgPerFed": 40.0,
    "potassiumKgPerFed": 20.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "High Phosphorus (W6)"
  },
  {
    "cropName": "Watermelon",
    "weeksLabel": "Week 7-11",
    "startWeek": 7,
    "endWeek": 11,
    "applicationTiming": "Fruit Dev.",
    "nitrogenKgPerFed": 15.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 30.0,
    "calciumKgPerFed": 10.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "Steady growth"
  },
  {
    "cropName": "Watermelon",
    "weeksLabel": "Week 12-16",
    "startWeek": 12,
    "endWeek": 16,
    "applicationTiming": "Sizing (Critical)",
    "nitrogenKgPerFed": 10.0,
    "phosphorusKgPerFed": 5.0,
    "potassiumKgPerFed": 50.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "High Potassium (W12) and sizing phase"
  },
  {
    "cropName": "Onion",
    "weeksLabel": "Week 1-3",
    "startWeek": 1,
    "endWeek": 3,
    "applicationTiming": "Establishment",
    "nitrogenKgPerFed": 15.0,
    "phosphorusKgPerFed": 20.0,
    "potassiumKgPerFed": 10.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Rooting phase"
  },
  {
    "cropName": "Onion",
    "weeksLabel": "Week 4-8",
    "startWeek": 4,
    "endWeek": 8,
    "applicationTiming": "Vegetative",
    "nitrogenKgPerFed": 35.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 15.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Nitrogen in early stages only (W4, W8)"
  },
  {
    "cropName": "Onion",
    "weeksLabel": "Week 9-17",
    "startWeek": 9,
    "endWeek": 17,
    "applicationTiming": "Bulb Swelling",
    "nitrogenKgPerFed": 0.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 40.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 5.0,
    "criticalRemarks": "No N, focus on P and K"
  },
  {
    "cropName": "Lettuce",
    "weeksLabel": "Week 1-2",
    "startWeek": 1,
    "endWeek": 2,
    "applicationTiming": "Growth",
    "nitrogenKgPerFed": 20.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 10.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "Daily watering, shallow roots"
  },
  {
    "cropName": "Lettuce",
    "weeksLabel": "Week 2-4",
    "startWeek": 2,
    "endWeek": 4,
    "applicationTiming": "Fast Growth",
    "nitrogenKgPerFed": 40.0,
    "phosphorusKgPerFed": 10.0,
    "potassiumKgPerFed": 15.0,
    "calciumKgPerFed": 5.0,
    "magnesiumKgPerFed": 2.0,
    "criticalRemarks": "High Nitrogen (W2, W4) to avoid bolting"
  }
] as const;

const CULTIVATION_GUIDE_DATA = [
  {
    "cropName": "Tomato",
    "bestPlantingSeason": "Spring / Autumn",
    "wateringFrequency": "Every 2-3 days",
    "criticalHeavyWateringPhase": "Weeks 8-12 (Fruit Set)",
    "stressingPeriod": "Week 4 (Moderate stress for deep roots)",
    "bestHarvestTimeWeeks": "Week 12 - 16",
    "harvestSigns": "Full red color & slight softness",
    "spacingCm": "50-60"
  },
  {
    "cropName": "Cucumber",
    "bestPlantingSeason": "Spring / Summer",
    "wateringFrequency": "Daily (High Humidity)",
    "criticalHeavyWateringPhase": "Throughout growth (W4 to End)",
    "stressingPeriod": "None (Avoid bitterness)",
    "bestHarvestTimeWeeks": "Week 7 - 9",
    "harvestSigns": "12-18 cm length, bright green",
    "spacingCm": "30-40"
  },
  {
    "cropName": "Bell Pepper",
    "bestPlantingSeason": "Spring",
    "wateringFrequency": "Every 2 days",
    "criticalHeavyWateringPhase": "Weeks 10-14 (Fruiting)",
    "stressingPeriod": "Week 5 (Light stress)",
    "bestHarvestTimeWeeks": "Week 14 - 18",
    "harvestSigns": "Firm skin & reaching full size",
    "spacingCm": "40-50"
  },
  {
    "cropName": "Eggplant",
    "bestPlantingSeason": "Spring",
    "wateringFrequency": "Every 2-3 days",
    "criticalHeavyWateringPhase": "Weeks 9-15 (Maturation)",
    "stressingPeriod": "Week 4 (Root development)",
    "bestHarvestTimeWeeks": "Week 15 - 20",
    "harvestSigns": "Glossy skin (Dull skin means overripe)",
    "spacingCm": "50-70"
  },
  {
    "cropName": "Strawberry",
    "bestPlantingSeason": "Autumn (Runner)",
    "wateringFrequency": "Every 1-2 days",
    "criticalHeavyWateringPhase": "Weeks 10-14 (Blooming)",
    "stressingPeriod": "Week 3 (Acclimatization)",
    "bestHarvestTimeWeeks": "Week 14 - 16",
    "harvestSigns": "75% to 100% red surface",
    "spacingCm": "25-30"
  },
  {
    "cropName": "Potatoes",
    "bestPlantingSeason": "Winter / Spring",
    "wateringFrequency": "Every 3-4 days",
    "criticalHeavyWateringPhase": "Weeks 6-12 (Tuber bulking)",
    "stressingPeriod": "Week 15+ (Stop watering to cure skin)",
    "bestHarvestTimeWeeks": "Week 16 - 20",
    "harvestSigns": "Foliage turns yellow and dies back",
    "spacingCm": "30-35"
  },
  {
    "cropName": "Carrots",
    "bestPlantingSeason": "Autumn / Spring",
    "wateringFrequency": "Consistent (Mist)",
    "criticalHeavyWateringPhase": "Weeks 1-3 (Germination)",
    "stressingPeriod": "None (Stress causes cracking)",
    "bestHarvestTimeWeeks": "Week 10 - 14",
    "harvestSigns": "Root shoulder diameter ~2cm",
    "spacingCm": "5-10"
  },
  {
    "cropName": "Watermelon",
    "bestPlantingSeason": "Late Spring",
    "wateringFrequency": "Heavy (Early stages)",
    "criticalHeavyWateringPhase": "Weeks 12-16 (Sizing)",
    "stressingPeriod": "2 weeks before harvest (Increases sugar)",
    "bestHarvestTimeWeeks": "Week 16 - 20",
    "harvestSigns": "Tendril near fruit dries, dull sound",
    "spacingCm": "150-200"
  },
  {
    "cropName": "Onion",
    "bestPlantingSeason": "Winter",
    "wateringFrequency": "Every 4-5 days",
    "criticalHeavyWateringPhase": "Weeks 8-14 (Bulb swelling)",
    "stressingPeriod": "Week 18+ (Stop watering when tops fall)",
    "bestHarvestTimeWeeks": "Week 20 - 24",
    "harvestSigns": "50% of green tops fall over",
    "spacingCm": "10-15"
  },
  {
    "cropName": "Lettuce",
    "bestPlantingSeason": "Autumn / Winter",
    "wateringFrequency": "Daily (Shallow roots)",
    "criticalHeavyWateringPhase": "All stages (W1 to End)",
    "stressingPeriod": "None (Causes bolting/bitterness)",
    "bestHarvestTimeWeeks": "Week 6 - 10",
    "harvestSigns": "Firm center & lush leaves",
    "spacingCm": "20-25"
  }
] as const;

const CROP_ALIASES: Record<string, string> = {
  tomato: "tomato",
  cucumber: "cucumber",
  pepper: "bell pepper",
  "bell pepper": "bell pepper",
  eggplant: "eggplant",
  strawberry: "strawberry",
  potato: "potatoes",
  potatoes: "potatoes",
  carrot: "carrots",
  carrots: "carrots",
  watermelon: "watermelon",
  onion: "onion",
  lettuce: "lettuce",
};

function normalizeCropKey(name: string) {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  return CROP_ALIASES[normalized] ?? normalized;
}

async function clearAgronomyTables(ctx: any) {
  const allFertilizerRows = await ctx.db.query("fertilizerSchedules").collect();
  for (const row of allFertilizerRows) {
    await ctx.db.delete(row._id);
  }

  const allGuideRows = await ctx.db.query("cultivationGuides").collect();
  for (const row of allGuideRows) {
    await ctx.db.delete(row._id);
  }
}

async function seedAgronomyTables(ctx: any) {
  for (const row of FERTILIZER_SCHEDULE_DATA) {
    await ctx.db.insert("fertilizerSchedules", {
      cropName: row.cropName,
      cropKey: normalizeCropKey(row.cropName),
      weeksLabel: row.weeksLabel,
      startWeek: row.startWeek,
      endWeek: row.endWeek ?? undefined,
      applicationTiming: row.applicationTiming,
      nitrogenKgPerFed: row.nitrogenKgPerFed,
      phosphorusKgPerFed: row.phosphorusKgPerFed,
      potassiumKgPerFed: row.potassiumKgPerFed,
      calciumKgPerFed: row.calciumKgPerFed,
      magnesiumKgPerFed: row.magnesiumKgPerFed,
      criticalRemarks: row.criticalRemarks,
    });
  }

  for (const row of CULTIVATION_GUIDE_DATA) {
    await ctx.db.insert("cultivationGuides", {
      cropName: row.cropName,
      cropKey: normalizeCropKey(row.cropName),
      bestPlantingSeason: row.bestPlantingSeason,
      wateringFrequency: row.wateringFrequency,
      criticalHeavyWateringPhase: row.criticalHeavyWateringPhase,
      stressingPeriod: row.stressingPeriod,
      bestHarvestTimeWeeks: row.bestHarvestTimeWeeks,
      harvestSigns: row.harvestSigns,
      spacingCm: row.spacingCm,
    });
  }
}

function formatNutrientSummary(phase: any) {
  if (!phase) return null;
  return `N:${phase.nitrogenKgPerFed} | P:${phase.phosphorusKgPerFed} | K:${phase.potassiumKgPerFed} | Ca:${phase.calciumKgPerFed} | Mg:${phase.magnesiumKgPerFed} kg/fed`;
}

function pickCurrentAndNextPhase(phases: any[], currentWeek: number) {
  const sorted = [...phases].sort((a, b) => a.startWeek - b.startWeek);

  const current =
    sorted.find(
      (p) =>
        p.startWeek <= currentWeek &&
        (p.endWeek === undefined || p.endWeek >= currentWeek),
    ) ??
    sorted[sorted.length - 1] ??
    null;

  const next = sorted.find((p) => p.startWeek > currentWeek) ?? null;
  return { current, next, sorted };
}

function resolveCurrentCropWeek(device: any) {
  const anchor = device.cropStartedAt ?? device.createdAt;
  return Math.max(1, Math.floor((Date.now() - anchor) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

async function buildDevicePlan(ctx: any, deviceId: any) {
  const device = await ctx.db.get(deviceId);
  if (!device) return null;
  const currentWeek = resolveCurrentCropWeek(device);

  const plant = device.plantId ? await ctx.db.get(device.plantId) : null;
  if (!plant) {
    return {
      deviceId: device._id,
      deviceName: device.name,
      currentWeek,
      cropName: null,
      fertilizerPhases: [],
      cultivationGuide: null,
      currentPhase: null,
      nextPhase: null,
      nutrientSummary: null,
      recommendation:
        "Select a crop for this zone to unlock weekly agronomy guidance.",
    };
  }

  const cropKey = normalizeCropKey(plant.name);

  const fertilizerPhases = await ctx.db
    .query("fertilizerSchedules")
    .withIndex("by_crop_week", (q: any) => q.eq("cropKey", cropKey))
    .collect();

  const cultivationGuide = await ctx.db
    .query("cultivationGuides")
    .withIndex("by_crop", (q: any) => q.eq("cropKey", cropKey))
    .first();

  const { current, next, sorted } = pickCurrentAndNextPhase(
    fertilizerPhases,
    currentWeek,
  );

  const recommendation = current
    ? `Week ${currentWeek} (${current.weeksLabel}): Apply ${formatNutrientSummary(current)}. ${current.criticalRemarks}`
    : "No fertilizer phase found for this crop yet. Run agronomy seed data first.";

  return {
    deviceId: device._id,
    deviceName: device.name,
    cropStartedAt: device.cropStartedAt ?? device.createdAt,
    currentWeek,
    cropName: plant.name,
    cropNameAr: plant.nameAr,
    fertilizerPhases: sorted,
    cultivationGuide,
    currentPhase: current,
    nextPhase: next,
    nutrientSummary: formatNutrientSummary(current),
    recommendation,
  };
}

export const seedAgronomyCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    await clearAgronomyTables(ctx);
    await seedAgronomyTables(ctx);

    return {
      success: true,
      fertilizerRows: FERTILIZER_SCHEDULE_DATA.length,
      guideRows: CULTIVATION_GUIDE_DATA.length,
    };
  },
});

export const getFertilizerSchedules = query({
  args: { cropName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.cropName) {
      return await ctx.db.query("fertilizerSchedules").collect();
    }

    const cropKey = normalizeCropKey(args.cropName);
    return await ctx.db
      .query("fertilizerSchedules")
      .withIndex("by_crop_week", (q) => q.eq("cropKey", cropKey))
      .collect();
  },
});

export const getCultivationGuide = query({
  args: { cropName: v.string() },
  handler: async (ctx, args) => {
    const cropKey = normalizeCropKey(args.cropName);
    return await ctx.db
      .query("cultivationGuides")
      .withIndex("by_crop", (q) => q.eq("cropKey", cropKey))
      .first();
  },
});

export const ensureAgronomyCatalogSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const fertilizerRows = await ctx.db.query("fertilizerSchedules").collect();
    const guideRows = await ctx.db.query("cultivationGuides").collect();
    const isFullySeeded = fertilizerRows.length > 0 && guideRows.length > 0;

    if (isFullySeeded) {
      return {
        success: true,
        seededNow: false,
        fertilizerRows: fertilizerRows.length,
        guideRows: guideRows.length,
      };
    }

    await clearAgronomyTables(ctx);
    await seedAgronomyTables(ctx);

    return {
      success: true,
      seededNow: true,
      fertilizerRows: FERTILIZER_SCHEDULE_DATA.length,
      guideRows: CULTIVATION_GUIDE_DATA.length,
    };
  },
});

export const getCultivationGuides = query({
  args: { cropName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.cropName) {
      return await ctx.db.query("cultivationGuides").collect();
    }
    const cropKey = normalizeCropKey(args.cropName);
    return await ctx.db
      .query("cultivationGuides")
      .withIndex("by_crop", (q) => q.eq("cropKey", cropKey))
      .collect();
  },
});

export const getDevicePlanInternal = internalQuery({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => buildDevicePlan(ctx, args.deviceId),
});

export const getDevicePlan = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) return null;

    return await buildDevicePlan(ctx, args.deviceId);
  },
});

export const getCatalogStatus = query({
  args: {},
  handler: async (ctx) => {
    const fertilizerRows = await ctx.db.query("fertilizerSchedules").collect();
    const guideRows = await ctx.db.query("cultivationGuides").collect();
    return {
      fertilizerCount: fertilizerRows.length,
      guideCount: guideRows.length,
      seeded: fertilizerRows.length > 0 && guideRows.length > 0,
    };
  },
});
