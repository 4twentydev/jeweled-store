import { getDb } from "@/db"
import { products, orders } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function getAllProducts() {
  return getDb().select().from(products).orderBy(desc(products.createdAt))
}

export async function getProductById(id: string) {
  const [product] = await getDb().select().from(products).where(eq(products.id, id))
  return product ?? null
}

export async function getAllOrders() {
  return getDb().select().from(orders).orderBy(desc(orders.createdAt))
}

export async function getAdminOrderWithItems(id: string) {
  const result = await getDb().query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      orderItems: {
        with: {
          product: true,
        },
      },
    },
  })
  return result ?? null
}

export async function getAdminStats() {
  const [allProducts, allOrders] = await Promise.all([
    getDb().select().from(products),
    getDb().select().from(orders),
  ])
  return {
    totalProducts: allProducts.length,
    activeProducts: allProducts.filter((p) => p.active).length,
    totalOrders: allOrders.length,
    totalRevenueCents: allOrders.reduce((sum, o) => sum + o.totalCents, 0),
  }
}
