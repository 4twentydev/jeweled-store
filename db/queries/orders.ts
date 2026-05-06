import { getDb } from "@/db"
import { orders, orderItems } from "@/db/schema"
import { and, eq } from "drizzle-orm"

export async function getOrders() {
  return getDb().select().from(orders).orderBy(orders.createdAt)
}

export async function getOrderByStripeSession(stripeCheckoutSessionId: string) {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, stripeCheckoutSessionId))
  return order ?? null
}

export async function getOrderBySessionAndLookupToken(
  stripeCheckoutSessionId: string,
  lookupToken: string
) {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.stripeCheckoutSessionId, stripeCheckoutSessionId),
        eq(orders.lookupToken, lookupToken)
      )
    )
  return order ?? null
}

export async function getOrderWithItems(orderId: string) {
  const order = await getDb().query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { orderItems: true },
  })
  return order ?? null
}

export async function getOrderItemsByOrderId(orderId: string) {
  return getDb().select().from(orderItems).where(eq(orderItems.orderId, orderId))
}
