import crypto from "crypto"
import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm"
import { getDb } from "@/db"
import { productReservations, products } from "@/db/schema"

export const RESERVATION_WINDOW_MINUTES = 30

export function createReservationToken() {
  return crypto.randomBytes(24).toString("base64url")
}

export function getReservationExpiry() {
  return new Date(Date.now() + RESERVATION_WINDOW_MINUTES * 60 * 1000)
}

export async function cleanupExpiredReservations(): Promise<void> {
  const db = getDb()
  const now = new Date()
  const expired = await db
    .select({
      id: productReservations.id,
      productId: productReservations.productId,
      quantity: productReservations.quantity,
    })
    .from(productReservations)
    .where(
      and(
        lte(productReservations.expiresAt, now),
        isNull(productReservations.fulfilledAt),
        isNull(productReservations.releasedAt)
      )
    )

  if (expired.length === 0) return

  await db.transaction(async (tx) => {
    for (const reservation of expired) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${reservation.quantity}` })
        .where(eq(products.id, reservation.productId))
    }

    await tx
      .update(productReservations)
      .set({ releasedAt: now })
      .where(inArray(productReservations.id, expired.map((r) => r.id)))
  })
}
