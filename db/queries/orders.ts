import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getOrders() {
  return db.select().from(orders);
}

export async function getOrderByStripeSession(stripeSessionId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, stripeSessionId));
  return order ?? null;
}
