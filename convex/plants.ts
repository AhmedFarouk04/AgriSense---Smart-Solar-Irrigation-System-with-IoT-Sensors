import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("plants").collect();
  },
});

export const get = query({
  args: { plantId: v.id("plants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.plantId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    nameAr: v.string(),
    minMoisture: v.number(),
    maxMoisture: v.number(),
    minSalinity: v.number(),
    maxSalinity: v.number(),
    optimalTemp: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("plants", args);
  },
});
