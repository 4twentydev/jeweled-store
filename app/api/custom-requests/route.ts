import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getDb } from "@/db"
import { customRequestAttempts, customRequests } from "@/db/schema"
import { getEnv } from "@/lib/env"
import { getClientIp, isAllowedOrigin } from "@/lib/request-guards"
import { customRequestSchema } from "@/lib/validators"
import { and, count, eq, gt, lt } from "drizzle-orm"

const CUSTOM_REQUEST_LIMIT = 3
const CUSTOM_REQUEST_WINDOW_MS = 60 * 60 * 1000

async function isRateLimited(ip: string): Promise<boolean> {
  const db = getDb()
  const windowStart = new Date(Date.now() - CUSTOM_REQUEST_WINDOW_MS)
  const rows = await db
    .select({ n: count() })
    .from(customRequestAttempts)
    .where(and(eq(customRequestAttempts.ip, ip), gt(customRequestAttempts.attemptedAt, windowStart)))

  return (rows[0]?.n ?? 0) >= CUSTOM_REQUEST_LIMIT
}

async function recordAttempt(ip: string): Promise<void> {
  const db = getDb()
  const expiry = new Date(Date.now() - CUSTOM_REQUEST_WINDOW_MS)
  await db.batch([
    db.insert(customRequestAttempts).values({ ip }),
    db.delete(customRequestAttempts).where(lt(customRequestAttempts.attemptedAt, expiry)),
  ])
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request, getEnv().NEXT_PUBLIC_APP_URL)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const ip = getClientIp(request)
  if (await isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

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
  await recordAttempt(ip)

  revalidatePath("/admin")
  revalidatePath("/admin/custom-requests")

  return NextResponse.json({ ok: true }, { status: 201 })
}
