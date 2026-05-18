import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    verificationCode: v.optional(v.string()),
    codeExpires: v.optional(v.number()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    farmName: v.optional(v.string()),
    farmArea: v.optional(v.number()),
    farmAreaUnit: v.optional(v.string()),
    location: v.optional(v.string()),
    role: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  devices: defineTable({
    userId: v.id("users"),
    name: v.string(),
    firebaseUrl: v.string(),
    firebaseSecret: v.string(),
    isActive: v.boolean(),
    plantId: v.optional(v.string()),
    areaM2: v.optional(v.number()),
    customMinMoisture: v.optional(v.number()),
    customMaxMoisture: v.optional(v.number()),
    customOptimalTemp: v.optional(v.number()),
    lastWeeklyPlanWeek: v.optional(v.number()),
    lastFertilizerPhaseLabel: v.optional(v.string()),
    isSimulationMode: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    cropStartedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    isMoistureLow: v.optional(v.boolean()),
    lastMoistureAlertAt: v.optional(v.number()),
    isTempHigh: v.optional(v.boolean()),
    lastTempAlertAt: v.optional(v.number()),
    isFlowLow: v.optional(v.boolean()),
    lastFlowAlertAt: v.optional(v.number()),
    isTankEmptySuspected: v.optional(v.boolean()),
    lastTankEmptyAlertAt: v.optional(v.number()),
    testOverrideUntil: v.optional(v.number()),
    freezeSimulationReadings: v.optional(v.boolean()),
    simulationMoisture: v.optional(v.number()),
    simulationTemperature: v.optional(v.number()),
    simulationFlowRate: v.optional(v.number()),
    simulationPumpStatus: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  readings: defineTable({
    userId: v.id("users"),
    deviceId: v.id("devices"),
    moisture: v.number(),
    temperature: v.number(),
    flowRate: v.number(),
    pumpStatus: v.boolean(),
    timestamp: v.number(),
    isTest: v.optional(v.boolean()),
  })
    .index("by_device_timestamp", ["deviceId", "timestamp"])
    .index("by_device", ["deviceId"]),

  events: defineTable({
    userId: v.id("users"),
    deviceId: v.optional(v.id("devices")),
    type: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_device", ["deviceId"])
    .index("by_user", ["userId"]),

  fertilizationSessions: defineTable({
    userId: v.id("users"),
    deviceId: v.id("devices"),
    startedAt: v.number(),
    expectedEndAt: v.number(),
    durationMinutes: v.number(),
    status: v.string(),
    stoppedAt: v.optional(v.number()),
    stopReason: v.optional(v.string()),
  }).index("by_device", ["deviceId"]),

  fertilizerSchedules: defineTable({
    cropName: v.string(),
    cropKey: v.string(),
    startWeek: v.number(),
    endWeek: v.optional(v.number()),
    phase: v.optional(v.string()),
    nitrogenKgPerFed: v.optional(v.number()),
    phosphorusKgPerFed: v.optional(v.number()),
    potassiumKgPerFed: v.optional(v.number()),
    calciumKgPerFed: v.optional(v.number()),
    magnesiumKgPerFed: v.optional(v.number()),
    applicationTiming: v.optional(v.string()),
    criticalRemarks: v.optional(v.string()),
    weeksLabel: v.optional(v.string()),
  })
    .index("by_crop", ["cropKey"])
    .index("by_crop_week", ["cropKey", "startWeek"]),

  cultivationGuides: defineTable({
    cropName: v.string(),
    cropKey: v.string(),
    bestPlantingSeason: v.optional(v.string()),
    wateringFrequency: v.optional(v.string()),
    criticalHeavyWateringPhase: v.optional(v.string()),
    stressingPeriod: v.optional(v.string()),
    bestHarvestTimeWeeks: v.optional(v.string()),
    harvestSigns: v.optional(v.string()),
    spacingCm: v.optional(v.string()),
  }).index("by_crop", ["cropKey"]),

  userSettings: defineTable({
    userId: v.id("users"),

    notificationsEnabled: v.optional(v.boolean()),

    escalationDelayMinutes: v.optional(v.number()),
    externalAlertsEnabled: v.optional(v.boolean()),
    externalAlertEmail: v.optional(v.string()),
    externalAlertPhone: v.optional(v.string()),
    externalAlertWhatsapp: v.optional(v.string()),
    pushWebhookUrl: v.optional(v.string()),
    lastNotificationsViewedAt: v.optional(v.number()),
    manualMode: v.optional(v.boolean()),
    pumpManualStatus: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  plants: defineTable({
    name: v.string(),
    nameAr: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    minMoisture: v.optional(v.number()),
    maxMoisture: v.optional(v.number()),
    minSalinity: v.optional(v.number()),
    maxSalinity: v.optional(v.number()),
    optimalTemp: v.optional(v.number()),
  }),

  // --- Auth Tables ---
  authSessions: defineTable({
    userId: v.id("users"),
    expirationTime: v.number(),
  }).index("userId", ["userId"]),
  authAccounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index("userIdAndProvider", ["userId", "provider"])
    .index("providerAndAccountId", ["provider", "providerAccountId"]),
  authRefreshTokens: defineTable({
    sessionId: v.id("authSessions"),
    expirationTime: v.number(),
    firstUsedTime: v.optional(v.number()),
    parentRefreshTokenId: v.optional(v.id("authRefreshTokens")),
  })
    .index("sessionId", ["sessionId"])
    .index("sessionIdAndParentRefreshTokenId", [
      "sessionId",
      "parentRefreshTokenId",
    ]),
  authVerificationCodes: defineTable({
    accountId: v.id("authAccounts"),
    provider: v.string(),
    code: v.string(),
    expirationTime: v.number(),
    verifier: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index("accountId", ["accountId"])
    .index("code", ["code"]),
  authVerifiers: defineTable({
    sessionId: v.optional(v.id("authSessions")),
    signature: v.optional(v.string()),
  }).index("signature", ["signature"]),
  authRateLimits: defineTable({
    identifier: v.string(),
    lastAttemptTime: v.number(),
    attemptsLeft: v.number(),
  }).index("identifier", ["identifier"]),
});
