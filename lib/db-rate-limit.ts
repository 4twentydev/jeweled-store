import { and, count, eq, gt, lt } from "drizzle-orm"
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
