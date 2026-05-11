import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  plants: defineTable({
    name: v.string(),
    nameAr: v.string(),
    minMoisture: v.number(),
    maxMoisture: v.number(),
    minSalinity: v.number(),
    maxSalinity: v.number(),
    optimalTemp: v.number(),
    description: v.string(),
  }).index("by_name", ["name"]),

  devices: defineTable({
    userId: v.id("users"),
    name: v.string(),
    firebaseUrl: v.string(),
    firebaseSecret: v.string(),
    plantId: v.optional(v.id("plants")),
    isActive: v.boolean(),
    createdAt: v.number(),
    cropStartedAt: v.optional(v.number()),
    // ✅ per-device thresholds
    customMinMoisture: v.optional(v.number()),
    customMaxMoisture: v.optional(v.number()),
    customOptimalTemp: v.optional(v.number()),
    // ✅ per-device info
    areaM2: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  userSettings: defineTable({
    userId: v.id("users"),
    // ✅ global settings فقط
    manualMode: v.boolean(),
    pumpManualStatus: v.boolean(),
    theme: v.optional(v.string()),
    language: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
    lastNotificationsViewedAt: v.optional(v.number()),
    escalationDelayMinutes: v.optional(v.number()),
    externalAlertsEnabled: v.optional(v.boolean()),
    externalAlertEmail: v.optional(v.string()),
    externalAlertPhone: v.optional(v.string()),
    externalAlertWhatsapp: v.optional(v.string()),
    pushWebhookUrl: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  readings: defineTable({
    userId: v.id("users"),
    deviceId: v.id("devices"),
    moisture: v.number(),
    temperature: v.number(),
    flowRate: v.number(),
    pumpStatus: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_device", ["deviceId"])
    .index("by_device_timestamp", ["deviceId", "timestamp"]),

  events: defineTable({
    userId: v.id("users"),
    deviceId: v.optional(v.id("devices")),
    type: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_device", ["deviceId"]),

  fertilizationSessions: defineTable({
    userId: v.id("users"),
    deviceId: v.id("devices"),
    startedAt: v.number(),
    expectedEndAt: v.number(),
    stoppedAt: v.optional(v.number()),
    durationMinutes: v.number(),
    status: v.string(),
    stopReason: v.optional(v.string()),
  })
    .index("by_device", ["deviceId"])
    .index("by_user", ["userId"]),

  fertilizerSchedules: defineTable({
    cropName: v.string(),
    cropKey: v.string(),
    weeksLabel: v.string(),
    startWeek: v.number(),
    endWeek: v.optional(v.number()),
    applicationTiming: v.string(),
    nitrogenKgPerFed: v.number(),
    phosphorusKgPerFed: v.number(),
    potassiumKgPerFed: v.number(),
    calciumKgPerFed: v.number(),
    magnesiumKgPerFed: v.number(),
    criticalRemarks: v.string(),
  })
    .index("by_crop", ["cropKey"])
    .index("by_crop_week", ["cropKey", "startWeek"]),

  cultivationGuides: defineTable({
    cropName: v.string(),
    cropKey: v.string(),
    bestPlantingSeason: v.string(),
    wateringFrequency: v.string(),
    criticalHeavyWateringPhase: v.string(),
    stressingPeriod: v.string(),
    bestHarvestTimeWeeks: v.string(),
    harvestSigns: v.string(),
    spacingCm: v.string(),
  }).index("by_crop", ["cropKey"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,

  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.string()),
    farmName: v.optional(v.string()),
    farmArea: v.optional(v.number()),
    farmAreaUnit: v.optional(v.string()),
    location: v.optional(v.string()),
    verificationCode: v.optional(v.string()),
    codeExpires: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("name", ["name"])
    .index("phone", ["phone"]),
});
