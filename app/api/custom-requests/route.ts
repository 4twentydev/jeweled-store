import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getDb } from "@/db"
import { customRequestAttempts, customRequests } from "@/db/schema"
import { getEnv } from "@/lib/env"
import { getClientIp, isAllowedOrigin } from "@/lib/request-guards"
import { customRequestSchema } from "@/lib/validators"
import { isRateLimited, recordAttempt } from "@/lib/db-rate-limit"
import { processPendingNotifications, queueNotification } from "@/lib/notifications"

const CUSTOM_REQUEST_LIMIT = 3
const CUSTOM_REQUEST_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  if (!isAllowedOrigin(request, getEnv().NEXT_PUBLIC_APP_URL)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const ip = getClientIp(request)
  if (await isRateLimited(customRequestAttempts, ip, CUSTOM_REQUEST_LIMIT, CUSTOM_REQUEST_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }
  await recordAttempt(customRequestAttempts, ip, CUSTOM_REQUEST_WINDOW_MS)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = customRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { customerName, customerEmail, itemDescription, budgetRange, referenceImages } = parsed.data

  const db = getDb()
  await db.insert(customRequests).values({
    customerName,
    customerEmail,
    itemDescription,
    budgetRange,
    referenceImages,
  })

  await queueNotification({
    kind: "admin_new_custom_request",
    channel: "admin",
    recipient: getEnv().ADMIN_NOTIFICATION_EMAIL ?? getEnv().ADMIN_EMAIL,
    subject: `New custom request from ${customerName}`,
    payload: {
      customerName,
      customerEmail,
      budgetRange,
    },
  })
  await processPendingNotifications()

  revalidatePath("/admin")
  revalidatePath("/admin/custom-requests")

  return NextResponse.json({ ok: true }, { status: 201 })
}
