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

function isUniqueConstraintViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "23505"
}

class StockDecrementFailedError extends Error {}

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

  // Fast-path idempotency: skip if this session was already processed.
  // This handles sequential retries cheaply. Concurrent duplicates that race
  // past this check are caught by the unique-constraint error handler below.
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

  const orderItemValues = existingItems.map((item) => ({
    orderId,
    productId: item.productId,
    quantity: item.quantity,
    priceAtPurchase: item.priceCents,
  }))

  try {
    if (canFulfill) {
      await db.transaction(async (tx) => {
        for (const item of cartItems) {
          const decremented = await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
            .returning({ id: products.id })

          if (decremented.length === 0) {
            throw new StockDecrementFailedError()
          }
        }

        await tx.insert(orders).values({
          id: orderId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          customerEmail: session.customer_email ?? undefined,
          customerName: customerDetails?.name ?? undefined,
          status: "new",
          totalCents: metadataTotalCents,
          shipping,
        })

        if (existingItems.length > 0) {
          await tx.insert(orderItems).values(
            existingItems.map((item) => ({
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: item.priceCents,
            }))
          )
        }
      })
    } else {
      await db.transaction(async (tx) => {
        await tx.insert(orders).values({
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

        if (orderItemValues.length > 0) {
          await tx.insert(orderItems).values(orderItemValues)
        }
      })
    }
  } catch (err) {
    if (err instanceof StockDecrementFailedError) {
      try {
        await db.transaction(async (tx) => {
          await tx.insert(orders).values({
            id: orderId,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : undefined,
            customerEmail: session.customer_email ?? undefined,
            customerName: customerDetails?.name ?? undefined,
            status: "cancelled",
            totalCents: metadataTotalCents,
            shipping,
          })

          if (orderItemValues.length > 0) {
            await tx.insert(orderItems).values(orderItemValues)
          }
        })
      } catch (insertErr) {
        if (isUniqueConstraintViolation(insertErr)) {
          return NextResponse.json({ received: true })
        }
        throw insertErr
      }
    } else {
      // PostgreSQL unique_violation (23505) on stripe_checkout_session_id means a
      // concurrent delivery already committed this session. Return 200 so Stripe
      // does not keep retrying.
      if (isUniqueConstraintViolation(err)) {
        return NextResponse.json({ received: true })
      }
      throw err
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
