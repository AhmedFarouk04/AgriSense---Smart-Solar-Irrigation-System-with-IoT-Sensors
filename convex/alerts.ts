import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

function formatEventSummary(event: any) {
  const when = new Date(event.timestamp).toISOString().replace("T", " ").slice(0, 16);
  return `[${event.type}] ${event.message} (${when} UTC)`;
}

function sanitizePhone(phone?: string | null) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned || null;
}

async function sendTwilioMessage({
  to,
  from,
  body,
}: {
  to: string;
  from: string;
  body: string;
}) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return { skipped: true, reason: "missing_twilio_credentials" };

  const auth = btoa(`${sid}:${token}`);
  const payload = new URLSearchParams({ To: to, From: from, Body: body });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Twilio request failed: ${res.status} ${txt}`);
  }
  return { skipped: false, success: true };
}

export const getEventInternal = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => ctx.db.get(args.eventId),
});

export const createEventInternal = internalMutation({
  args: {
    userId: v.id("users"),
    deviceId: v.optional(v.id("devices")),
    type: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const scheduleEscalationForEvent = internalAction({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.runQuery(internal.alerts.getEventInternal, { eventId: args.eventId });
    if (!event) return;
    if (!["low_moisture", "alert"].includes(event.type)) return;

    const settings = await ctx.runQuery(internal.alerts.getUserSettingsInternal, {
      userId: event.userId,
    });
    const delayMinutes = Math.max(5, Math.min(180, settings?.escalationDelayMinutes ?? 20));
    await ctx.scheduler.runAfter(delayMinutes * 60 * 1000, internal.alerts.checkAndEscalateEvent, {
      eventId: args.eventId,
    });
  },
});

export const getUserSettingsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first(),
});

export const getUserInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => await ctx.db.get(args.userId),
});

export const checkAndEscalateEvent = internalAction({
  args: { eventId: v.id("events") },
  handler: async (
    ctx,
    args,
  ): Promise<
    | { skipped: true; reason: string }
    | { success: true; escalatedId: Id<"events"> }
  > => {
    const sourceEvent = await ctx.runQuery(internal.alerts.getEventInternal, {
      eventId: args.eventId,
    });
    if (!sourceEvent) return { skipped: true, reason: "source_missing" };
    if (!["low_moisture", "alert"].includes(sourceEvent.type)) {
      return { skipped: true, reason: "type_not_escalatable" };
    }

    const settings = await ctx.runQuery(internal.alerts.getUserSettingsInternal, {
      userId: sourceEvent.userId,
    });
    const viewedAt = settings?.lastNotificationsViewedAt ?? 0;
    if (viewedAt >= sourceEvent.timestamp) {
      return { skipped: true, reason: "already_viewed" };
    }

    const existingEscalation = await ctx.runQuery(internal.alerts.findEscalationBySourceEvent, {
      userId: sourceEvent.userId,
      sourceEventId: sourceEvent._id,
    });
    if (existingEscalation) {
      return { skipped: true, reason: "already_escalated" };
    }

    const escalatedId = await ctx.runMutation(internal.alerts.createEventInternal, {
      userId: sourceEvent.userId,
      deviceId: sourceEvent.deviceId,
      type: "critical_escalation",
      message: `Escalation: ${sourceEvent.message}`,
      data: {
        severity: "critical",
        sourceEventId: sourceEvent._id,
        sourceType: sourceEvent.type,
        escalatedAt: Date.now(),
      },
    });

    await ctx.runAction(internal.alerts.dispatchExternalNotifications, {
      eventId: escalatedId,
    });

    return { success: true, escalatedId };
  },
});

export const findEscalationBySourceEvent = internalQuery({
  args: {
    userId: v.id("users"),
    sourceEventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(200);
    return (
      events.find(
        (e) =>
          e.type === "critical_escalation" &&
          e.data?.sourceEventId === args.sourceEventId,
      ) ?? null
    );
  },
});

export const dispatchExternalNotifications = internalAction({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.runQuery(internal.alerts.getEventInternal, { eventId: args.eventId });
    if (!event) return { skipped: true, reason: "event_missing" };

    const user = await ctx.runQuery(internal.alerts.getUserInternal, {
      userId: event.userId,
    });
    const settings = await ctx.runQuery(internal.alerts.getUserSettingsInternal, {
      userId: event.userId,
    });

    if (settings?.externalAlertsEnabled === false) {
      return { skipped: true, reason: "external_alerts_disabled" };
    }

    const summary = formatEventSummary(event);
    const channels: Record<string, any> = {};

    // Email channel
    const email = settings?.externalAlertEmail ?? user?.email;
    if (email) {
      try {
        await ctx.runAction(internal.email.sendCriticalAlertEmail, {
          email,
          subject: "AgriSense Critical Alert",
          message: summary,
        });
        channels.email = { success: true };
      } catch (err: any) {
        channels.email = { success: false, error: err?.message ?? "failed" };
      }
    } else {
      channels.email = { skipped: true, reason: "no_email" };
    }

    // SMS channel
    const smsTarget = sanitizePhone(settings?.externalAlertPhone ?? user?.phone);
    const smsFrom = process.env.TWILIO_SMS_FROM;
    if (smsTarget && smsFrom) {
      try {
        channels.sms = await sendTwilioMessage({
          to: smsTarget,
          from: smsFrom,
          body: `AgriSense Alert: ${summary}`,
        });
      } catch (err: any) {
        channels.sms = { success: false, error: err?.message ?? "failed" };
      }
    } else {
      channels.sms = { skipped: true, reason: "missing_phone_or_sms_from" };
    }

    // WhatsApp channel
    const waTarget = sanitizePhone(settings?.externalAlertWhatsapp ?? settings?.externalAlertPhone ?? user?.phone);
    const waFrom = process.env.TWILIO_WHATSAPP_FROM;
    if (waTarget && waFrom) {
      try {
        channels.whatsapp = await sendTwilioMessage({
          to: `whatsapp:${waTarget}`,
          from: waFrom,
          body: `AgriSense Alert: ${summary}`,
        });
      } catch (err: any) {
        channels.whatsapp = { success: false, error: err?.message ?? "failed" };
      }
    } else {
      channels.whatsapp = { skipped: true, reason: "missing_phone_or_whatsapp_from" };
    }

    // Push/Webhook channel
    const webhookUrl = settings?.pushWebhookUrl ?? process.env.PUSH_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "AgriSense Critical Alert",
            message: event.message,
            type: event.type,
            timestamp: event.timestamp,
            deviceId: event.deviceId,
            userId: event.userId,
            data: event.data,
          }),
        });
        channels.push = { success: res.ok, status: res.status };
      } catch (err: any) {
        channels.push = { success: false, error: err?.message ?? "failed" };
      }
    } else {
      channels.push = { skipped: true, reason: "no_webhook" };
    }

    return { success: true, channels };
  },
});
