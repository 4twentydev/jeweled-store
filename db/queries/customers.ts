import { getDb } from "@/db"
import { orders } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getOrdersByEmail(email: string) {
  return getDb().select().from(orders).where(eq(orders.customerEmail, email))
}
