import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getStripe } from "@/lib/stripe"
import { getEnv } from "@/lib/env"
import { getDb } from "@/db"
import { orders, orderItems, products } from "@/db/schema"
import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { randomUUID } from "crypto"
import { z } from "zod"
import type Stripe from "stripe"

const metadataItemsSchema = z
  .array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.int().min(1),
      priceCents: z.int().min(1),
    })
  )
  .min(1)

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
  let cartItems: z.infer<typeof metadataItemsSchema>
  try {
    const parsedItems = metadataItemsSchema.parse(JSON.parse(session.metadata?.items ?? "[]"))
    cartItems = Array.from(
      parsedItems
        .reduce((map, item) => {
          const existing = map.get(item.productId)
          if (existing) {
            if (existing.priceCents !== item.priceCents) {
              throw new Error("Conflicting item prices")
            }
            existing.quantity += item.quantity
          } else {
            map.set(item.productId, { ...item })
          }
          return map
        }, new Map<string, z.infer<typeof metadataItemsSchema>[number]>())
        .values()
    )
  } catch {
    return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 })
  }

  const metadataTotalCents = cartItems.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0
  )
  if (typeof session.amount_total === "number" && session.amount_total !== metadataTotalCents) {
    return NextResponse.json({ error: "Session total mismatch" }, { status: 400 })
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

  const db = getDb()
  const orderId = randomUUID()
  const paidProductIds = cartItems.map((i) => i.productId)
  let productSlugs: string[] = []

  // Idempotency: skip if this session was already processed
  const [alreadyProcessed] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, session.id))

  if (alreadyProcessed) {
    return NextResponse.json({ received: true })
  }

  // Fetch products to determine fulfillability
  const dbProducts = await db
    .select({ id: products.id, slug: products.slug, active: products.active, stock: products.stock })
    .from(products)
    .where(inArray(products.id, paidProductIds))

  const productMap = new Map(dbProducts.map((p) => [p.id, p]))
  productSlugs = dbProducts.map((p) => p.slug)

  const canFulfill =
    cartItems.every((item) => productMap.get(item.productId)?.active) &&
    cartItems.every((item) => {
      const p = productMap.get(item.productId)
      return p && p.stock >= item.quantity
    })

  const orderStatus = canFulfill ? ("new" as const) : ("cancelled" as const)
  const existingItems = cartItems.filter((item) => productMap.has(item.productId))

  // db.batch() on Neon HTTP executes within an implicit transaction.
  // Stock decrements use a gte guard to prevent negative stock even under concurrency.
  const decrementQueries = canFulfill
    ? cartItems.map((item) =>
        db
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
          .returning({ id: products.id })
      )
    : []

  const insertOrderQuery = db.insert(orders).values({
    id: orderId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    customerEmail: session.customer_email ?? undefined,
    customerName: customerDetails?.name ?? undefined,
    status: orderStatus,
    totalCents: metadataTotalCents,
    shipping,
  })

  const insertItemsQueries =
    existingItems.length > 0
      ? [
          db.insert(orderItems).values(
            existingItems.map((item) => ({
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: item.priceCents,
            }))
          ),
        ]
      : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const batchResults = await db.batch([...decrementQueries, insertOrderQuery, ...insertItemsQueries] as [any, ...any[]])

  // Verify every stock decrement actually hit a row. If the gte guard fired for any
  // item (concurrent checkout won the race), flip this order to cancelled immediately.
  if (canFulfill) {
    const decrementResults = batchResults.slice(0, decrementQueries.length) as Array<Array<{ id: string }>>
    const anyFailed = decrementResults.some((rows) => rows.length === 0)
    if (anyFailed) {
      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId))
    }
  }

  revalidatePath("/")
  revalidatePath("/products")
  revalidatePath("/admin")
  revalidatePath("/admin/orders")
  revalidatePath("/admin/products")
  for (const slug of productSlugs) {
    revalidatePath(`/product/${slug}`)
  }

  return NextResponse.json({ received: true })
}
