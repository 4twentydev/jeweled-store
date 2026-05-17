import { and, count, eq, gt, lt, sql } from "drizzle-orm"
import { getDb } from "@/db"
import {
  adminLoginAttempts,
  checkoutAttempts,
  customRequestAttempts,
  customRequestUploadAttempts,
} from "@/db/schema"

type AttemptTable =
  | typeof adminLoginAttempts
  | typeof checkoutAttempts
  | typeof customRequestAttempts
  | typeof customRequestUploadAttempts

function getRateLimitScope(table: AttemptTable): string {
  if (table === adminLoginAttempts) return "admin_login_attempts"
  if (table === checkoutAttempts) return "checkout_attempts"
  if (table === customRequestAttempts) return "custom_request_attempts"
  return "custom_request_upload_attempts"
}

export async function consumeRateLimit(
  table: AttemptTable,
  ip: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const db = getDb()
  const scope = `${getRateLimitScope(table)}:${ip}`
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${scope})::bigint)`)

    const rows = await tx
      .select({ n: count() })
      .from(table)
      .where(and(eq(table.ip, ip), gt(table.attemptedAt, windowStart)))

    if ((rows[0]?.n ?? 0) >= limit) return false

    await tx.insert(table).values({ ip, attemptedAt: now })
    await tx.delete(table).where(lt(table.attemptedAt, windowStart))
    return true
  })
}

export async function isRateLimited(
  table: AttemptTable,
  ip: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs)
  const rows = await getDb()
    .select({ n: count() })
    .from(table)
    .where(and(eq(table.ip, ip), gt(table.attemptedAt, windowStart)))

  return (rows[0]?.n ?? 0) >= limit
}

export async function recordAttempt(
  table: AttemptTable,
  ip: string,
  windowMs: number
): Promise<void> {
  const expiry = new Date(Date.now() - windowMs)
  await getDb().insert(table).values({ ip })
  await getDb().delete(table).where(lt(table.attemptedAt, expiry))
}

export async function clearAttempts(table: AttemptTable, ip: string): Promise<void> {
  await getDb().delete(table).where(eq(table.ip, ip))
}
