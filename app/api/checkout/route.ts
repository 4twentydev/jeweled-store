import { NextResponse } from "next/server"
import { checkoutSchema } from "@/lib/validators"
import { getDb } from "@/db"
import { getStripe } from "@/lib/stripe"
import { getEnv } from "@/lib/env"
import { SHIPPING_CENTS, formatShippingLabel } from "@/lib/checkout"
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/request-guards"
import { products } from "@/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import crypto from "crypto"

const CHECKOUT_LIMIT = 10
const CHECKOUT_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: Request) {
  const env = getEnv()
  if (!isAllowedOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const ip = getClientIp(request)
  if (
    !checkRateLimit({
      key: `checkout:${ip}`,
      limit: CHECKOUT_LIMIT,
      windowMs: CHECKOUT_WINDOW_MS,
    })
  ) {
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

  const lookupToken = crypto.randomBytes(32).toString("base64url")
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: email,
    line_items: lineItems,
    success_url: `${env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}&lookup_token=${lookupToken}`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/cart`,
    metadata: {
      lookupToken,
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

  return NextResponse.json({ url: session.url })
}
