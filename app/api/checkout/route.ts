import { NextResponse } from "next/server"
import { checkoutSchema } from "@/lib/validators"
import { getDb } from "@/db"
import { getStripe } from "@/lib/stripe"
import { getCheckoutEnv } from "@/lib/env"
import { SHIPPING_CENTS, formatShippingLabel } from "@/lib/checkout"
import { getClientIp, isAllowedOrigin } from "@/lib/request-guards"
import { checkoutAttempts, productReservations, products } from "@/db/schema"
import { and, eq, gte, inArray, sql } from "drizzle-orm"
import crypto from "crypto"
import { isRateLimited, recordAttempt } from "@/lib/db-rate-limit"
import {
  cleanupExpiredReservations,
  createReservationToken,
  getReservationExpiry,
} from "@/lib/reservations"

const CHECKOUT_LIMIT = 10
const CHECKOUT_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: Request) {
  let env: ReturnType<typeof getCheckoutEnv>
  try {
    env = getCheckoutEnv()
  } catch (error) {
    console.error("[checkout] missing payment configuration:", error)
    return NextResponse.json(
      { error: "Checkout is not configured. Please contact support." },
      { status: 503 }
    )
  }

  if (!isAllowedOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const ip = getClientIp(request)
  if (await isRateLimited(checkoutAttempts, ip, CHECKOUT_LIMIT, CHECKOUT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please try again later." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email, items } = parsed.data
  await recordAttempt(checkoutAttempts, ip, CHECKOUT_WINDOW_MS)
  await cleanupExpiredReservations()

  const aggregatedItems = Array.from(
    items
      .reduce((map, item) => {
        map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity)
        return map
      }, new Map<string, number>())
      .entries()
  ).map(([productId, quantity]) => ({ productId, quantity }))
  const db = getDb()

  const productIds = aggregatedItems.map((i) => i.productId)
  const dbProducts = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.active, true)))

  const productMap = new Map(dbProducts.map((p) => [p.id, p]))

  for (const item of aggregatedItems) {
    const product = productMap.get(item.productId)
    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.productId} not found or unavailable` },
        { status: 400 }
      )
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for "${product.name}"` },
        { status: 400 }
      )
    }
  }

  const reservationToken = createReservationToken()
  const lookupToken = crypto.randomBytes(32).toString("base64url")
  const reservationExpiry = getReservationExpiry()

  try {
    await db.transaction(async (tx) => {
      for (const item of aggregatedItems) {
        const decremented = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
          .returning({ id: products.id })

        if (decremented.length === 0) {
          throw new Error("Inventory changed before checkout could begin")
        }
      }

      await tx.insert(productReservations).values(
        aggregatedItems.map((item) => ({
          reservationToken,
          productId: item.productId,
          quantity: item.quantity,
          customerEmail: email,
          expiresAt: reservationExpiry,
        }))
      )
    })

    const lineItems = aggregatedItems.map((item) => {
      const product = productMap.get(item.productId)!
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            ...(product.images.length > 0 ? { images: [product.images[0]] } : {}),
          },
          unit_amount: product.priceCents,
        },
        quantity: item.quantity,
      }
    })

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      client_reference_id: reservationToken,
      line_items: lineItems,
      success_url: `${env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}&lookup_token=${lookupToken}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/cart`,
      expires_at: Math.floor(reservationExpiry.getTime() / 1000),
      metadata: {
        lookupToken,
        reservationToken,
        items: JSON.stringify(
          aggregatedItems.map((item) => {
            const product = productMap.get(item.productId)!
            return {
              productId: item.productId,
              quantity: item.quantity,
              priceCents: product.priceCents,
            }
          })
        ),
      },
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_CENTS, currency: "usd" },
            display_name: formatShippingLabel(),
          },
        },
      ],
    })

    await db
      .update(productReservations)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(productReservations.reservationToken, reservationToken))

    return NextResponse.json({ url: session.url })
  } catch (error) {
    await db.transaction(async (tx) => {
      const heldReservations = await tx
        .select({
          id: productReservations.id,
          productId: productReservations.productId,
          quantity: productReservations.quantity,
        })
        .from(productReservations)
        .where(eq(productReservations.reservationToken, reservationToken))

      if (heldReservations.length === 0) return

      for (const reservation of heldReservations) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${reservation.quantity}` })
          .where(eq(products.id, reservation.productId))
      }

      await tx
        .delete(productReservations)
        .where(eq(productReservations.reservationToken, reservationToken))
    })

    const message =
      error instanceof Error && error.message.includes("Inventory changed")
        ? "Inventory changed while starting checkout. Please review your cart and try again."
        : "Unable to start checkout right now. Please try again."
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
