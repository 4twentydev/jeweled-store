import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getOrdersByEmail(email: string) {
  return db.select().from(orders).where(eq(orders.customerEmail, email));
}
