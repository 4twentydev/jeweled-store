import crypto from "crypto"
import { and, eq, isNotNull, isNull, lte, sql } from "drizzle-orm"
import { getDb } from "@/db"
import { productReservations, products } from "@/db/schema"
import { getStripe } from "@/lib/stripe"

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

export async function releaseReservationsBySession(sessionId: string): Promise<void> {
  const db = getDb()

  await db.transaction(async (tx) => {
    const released = await tx
      .update(productReservations)
      .set({ releasedAt: new Date() })
      .where(
        and(
          eq(productReservations.stripeCheckoutSessionId, sessionId),
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

export async function reconcileExpiredSessionReservations(limit = 50): Promise<{
  checked: number
  releasedSessions: number
}> {
  const now = new Date()
  const rows = await getDb()
    .select({ stripeCheckoutSessionId: productReservations.stripeCheckoutSessionId })
    .from(productReservations)
    .where(
      and(
        lte(productReservations.expiresAt, now),
        isNotNull(productReservations.stripeCheckoutSessionId),
        isNull(productReservations.fulfilledAt),
        isNull(productReservations.releasedAt)
      )
    )
    .limit(limit)

  const sessionIds = Array.from(
    new Set(rows.flatMap((row) => row.stripeCheckoutSessionId ?? []))
  )

  let releasedSessions = 0
  for (const sessionId of sessionIds) {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    if (session.status !== "expired") continue

    await releaseReservationsBySession(sessionId)
    releasedSessions += 1
  }

  return { checked: sessionIds.length, releasedSessions }
}
