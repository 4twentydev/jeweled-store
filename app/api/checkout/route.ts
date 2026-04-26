import { NextResponse } from "next/server"
import { checkoutSchema } from "@/lib/validators"
import { getDb } from "@/db"
import { getStripe } from "@/lib/stripe"
import { getEnv } from "@/lib/env"
import { products } from "@/db/schema"
import { and, eq, inArray } from "drizzle-orm"

export async function POST(request: Request) {
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
  const db = getDb()

  const productIds = items.map((i) => i.productId)
  const dbProducts = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.active, true)))

  const productMap = new Map(dbProducts.map((p) => [p.id, p]))

  for (const item of items) {
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

  const lineItems = items.map((item) => {
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

  const env = getEnv()
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: email,
    line_items: lineItems,
    success_url: `${env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/cart`,
    metadata: { items: JSON.stringify(items) },
    shipping_address_collection: { allowed_countries: ["US", "CA"] },
  })

  return NextResponse.json({ url: session.url })
}
