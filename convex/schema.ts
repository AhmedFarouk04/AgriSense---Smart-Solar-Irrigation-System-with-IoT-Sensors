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

  userSettings: defineTable({
    userId: v.id("users"),
    selectedPlantId: v.optional(v.id("plants")),
    manualMode: v.boolean(),
    pumpManualStatus: v.boolean(),
    customMinMoisture: v.optional(v.number()),
    customMaxMoisture: v.optional(v.number()),
    customMinSalinity: v.optional(v.number()),
    customMaxSalinity: v.optional(v.number()),
    customOptimalTemp: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  readings: defineTable({
    userId: v.id("users"),
    moisture: v.number(),
    salinity: v.number(),
    temperature: v.number(),
    pumpStatus: v.boolean(),
    autoTriggered: v.boolean(),
  }).index("by_user", ["userId"]),

  events: defineTable({
    userId: v.id("users"),
    type: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  }).index("by_user", ["userId"]),
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
    farmArea: v.optional(v.number()),
    location: v.optional(v.string()),
    verificationCode: v.optional(v.string()),
    codeExpires: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("name", ["name"])
    .index("phone", ["phone"]),
});
