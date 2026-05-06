import { asc, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { notificationEvents } from "@/db/schema"
import { getEnv } from "@/lib/env"

type NotificationPayload = Record<string, unknown>

function buildMessage(
  kind: string,
  payload: NotificationPayload
): { text: string; html: string } {
  switch (kind) {
    case "order_confirmation":
      return {
        text: `Your order has been confirmed. Order ID: ${String(payload.orderId ?? "")}. Total: ${String(payload.totalCents ?? "")}.`,
        html: `<p>Your order has been confirmed.</p><p>Order ID: ${String(payload.orderId ?? "")}</p><p>Total cents: ${String(payload.totalCents ?? "")}</p>`,
      }
    case "order_cancelled":
      return {
        text: `Your order could not be fulfilled automatically. Order ID: ${String(payload.orderId ?? "")}. Reason: ${String(payload.reason ?? "inventory update")}.`,
        html: `<p>Your order could not be fulfilled automatically.</p><p>Order ID: ${String(payload.orderId ?? "")}</p><p>Reason: ${String(payload.reason ?? "inventory update")}</p>`,
      }
    case "customer_quote_ready":
      return {
        text: `Your custom quote is ready. Price: ${String(payload.quotedPrice ?? "")}. Payment link: ${String(payload.paymentLink ?? "")}`,
        html: `<p>Your custom quote is ready.</p><p>Price: ${String(payload.quotedPrice ?? "")}</p><p>Payment link: ${String(payload.paymentLink ?? "")}</p>`,
      }
    default:
      return {
        text: JSON.stringify(payload),
        html: `<pre>${JSON.stringify(payload, null, 2)}</pre>`,
      }
  }
}

async function sendViaResend(recipient: string, subject: string, kind: string, payload: NotificationPayload) {
  const env = getEnv()
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured")
  }

  const { text, html } = buildMessage(kind, payload)
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.ADMIN_NOTIFICATION_EMAIL ?? env.ADMIN_EMAIL,
      to: [recipient],
      subject,
      text,
      html,
    }),
  })

  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
  if (!response.ok) {
    throw new Error(body.message ?? `Resend error ${response.status}`)
  }

  return body.id ?? null
}

export async function processPendingNotifications(limit = 10): Promise<void> {
  const db = getDb()
  const pending = await db
    .select()
    .from(notificationEvents)
    .where(eq(notificationEvents.status, "pending"))
    .orderBy(asc(notificationEvents.createdAt))
    .limit(limit)

  for (const event of pending) {
    try {
      if (!event.recipient) {
        await db
          .update(notificationEvents)
          .set({
            status: "skipped",
            errorMessage: "Missing recipient",
            sentAt: new Date(),
          })
          .where(eq(notificationEvents.id, event.id))
        continue
      }

      const externalId =
        event.channel === "admin" || event.channel === "email"
          ? await sendViaResend(
              event.recipient,
              event.subject ?? event.kind,
              event.kind,
              (event.payload ?? {}) as NotificationPayload
            )
          : null

      await db
        .update(notificationEvents)
        .set({
          status: "sent",
          externalId,
          errorMessage: null,
          sentAt: new Date(),
        })
        .where(eq(notificationEvents.id, event.id))
    } catch (error) {
      await db
        .update(notificationEvents)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown notification error",
        })
        .where(eq(notificationEvents.id, event.id))
    }
  }
}

export async function queueNotification(event: {
  kind: string
  channel: string
  recipient?: string | null
  subject?: string | null
  payload: NotificationPayload
}) {
  await getDb().insert(notificationEvents).values({
    kind: event.kind,
    channel: event.channel,
    recipient: event.recipient ?? null,
    subject: event.subject ?? null,
    payload: event.payload,
    status: "pending",
  })
}
