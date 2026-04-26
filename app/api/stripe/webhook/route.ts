import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getEnv } from "@/lib/env"
import { getDb } from "@/db"
import { orders, orderItems, products } from "@/db/schema"
import { eq, inArray, sql } from "drizzle-orm"
import type Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getEnv().STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const db = getDb()

  // Idempotency: skip if this session was already processed
  const existing = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, session.id))

  if (existing.length > 0) {
    return NextResponse.json({ received: true })
  }

  let cartItems: Array<{ productId: string; quantity: number }>
  try {
    cartItems = JSON.parse(session.metadata?.items ?? "[]")
  } catch {
    return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 })
  }

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "No items in session metadata" }, { status: 400 })
  }

  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, cartItems.map((i) => i.productId)))

  const productMap = new Map(dbProducts.map((p) => [p.id, p]))

  let totalCents = 0
  for (const item of cartItems) {
    const product = productMap.get(item.productId)
    if (product) totalCents += product.priceCents * item.quantity
  }

  const customerDetails = session.customer_details
  const shipping =
    customerDetails?.address
      ? {
          name: customerDetails.name ?? "",
          line1: customerDetails.address.line1 ?? "",
          line2: customerDetails.address.line2 ?? undefined,
          city: customerDetails.address.city ?? "",
          state: customerDetails.address.state ?? "",
          postal_code: customerDetails.address.postal_code ?? "",
          country: customerDetails.address.country ?? "",
        }
      : undefined

  const [order] = await db
    .insert(orders)
    .values({
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      customerEmail: session.customer_email ?? undefined,
      customerName: customerDetails?.name ?? undefined,
      status: "new",
      totalCents,
      shipping,
    })
    .returning({ id: orders.id })

  for (const item of cartItems) {
    const product = productMap.get(item.productId)
    if (!product) continue

    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: product.priceCents,
    })

    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(eq(products.id, item.productId))
  }

  return NextResponse.json({ received: true })
}
