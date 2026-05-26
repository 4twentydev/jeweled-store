import { asc, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { notificationEvents } from "@/db/schema"
import { getEnv } from "@/lib/env"

type NotificationPayload = Record<string, unknown>

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function payloadText(payload: NotificationPayload, key: string): string {
  return String(payload[key] ?? "")
}

function formatCents(value: unknown): string {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100)
    : ""
}

function buildMessage(
  kind: string,
  payload: NotificationPayload
): { text: string; html: string } {
  const orderId = payloadText(payload, "orderId")
  const reason = payloadText(payload, "reason") || "inventory update"
  const total = formatCents(payload.totalCents)
  const paymentLink = payloadText(payload, "paymentLink")
  const quotedPrice = payloadText(payload, "quotedPrice")
  const customRequestId = payloadText(payload, "customRequestId")

  switch (kind) {
    case "order_confirmation":
      return {
        text: `Your order has been confirmed. Order ID: ${orderId}. Total: ${total}.`,
        html: `<p>Your order has been confirmed.</p><p>Order ID: ${escapeHtml(orderId)}</p><p>Total: ${escapeHtml(total)}</p>`,
      }
    case "order_cancelled":
      return {
        text: `Your order could not be fulfilled automatically. Order ID: ${orderId}. Reason: ${reason}.`,
        html: `<p>Your order could not be fulfilled automatically.</p><p>Order ID: ${escapeHtml(orderId)}</p><p>Reason: ${escapeHtml(reason)}</p>`,
      }
    case "customer_quote_ready":
      return {
        text: `Your custom quote is ready. Price: ${quotedPrice}. Payment link: ${paymentLink}`,
        html: `<p>Your custom quote is ready.</p><p>Price: ${escapeHtml(quotedPrice)}</p><p>Payment link: ${escapeHtml(paymentLink)}</p>`,
      }
    case "admin_custom_request_paid":
      return {
        text: `Custom request payment received. Request ID: ${customRequestId}. Total: ${total}.`,
        html: `<p>Custom request payment received.</p><p>Request ID: ${escapeHtml(customRequestId)}</p><p>Total: ${escapeHtml(total)}</p>`,
      }
    case "custom_request_payment_confirmation":
      return {
        text: `Your custom request payment was received. Request ID: ${customRequestId}. Total: ${total}.`,
        html: `<p>Your custom request payment was received.</p><p>Request ID: ${escapeHtml(customRequestId)}</p><p>Total: ${escapeHtml(total)}</p>`,
      }
    default:
      const json = JSON.stringify(payload, null, 2)
      return {
        text: JSON.stringify(payload),
        html: `<pre>${escapeHtml(json)}</pre>`,
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
