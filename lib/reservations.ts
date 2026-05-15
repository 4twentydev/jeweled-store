import crypto from "crypto"
import { and, eq, isNull, lte, sql } from "drizzle-orm"
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

  await db.transaction(async (tx) => {
    const released = await tx
      .update(productReservations)
      .set({ releasedAt: now })
      .where(
        and(
          lte(productReservations.expiresAt, now),
          isNull(productReservations.stripeCheckoutSessionId),
          isNull(productReservations.fulfilledAt),
          isNull(productReservations.releasedAt)
        )
      )
      .returning({
        id: productReservations.id,
        productId: productReservations.productId,
        quantity: productReservations.quantity,
      })

    for (const reservation of released) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${reservation.quantity}` })
        .where(eq(products.id, reservation.productId))
    }
  })
}
