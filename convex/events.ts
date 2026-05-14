// convex/events.ts
import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { cleanEventDataForUI } from "./users";

export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);

    return events.map(cleanEventDataForUI);
  },
});

export const getEventsByDeviceRange = query({
  args: {
    deviceId: v.id("devices"),
    startTs: v.number(),
    endTs: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) return [];

    const events = await ctx.db
      .query("events")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .take(300);

    return events
      .filter((e) => e.timestamp >= args.startTs && e.timestamp <= args.endTs)
      .map(cleanEventDataForUI);
  },
});
