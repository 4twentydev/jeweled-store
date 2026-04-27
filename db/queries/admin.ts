import { getDb } from "@/db"
import { products, orders } from "@/db/schema"
import { count, desc, eq, sum } from "drizzle-orm"

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
  const [productStats, activeProductStats, orderStats] = await Promise.all([
    getDb().select({ totalProducts: count() }).from(products),
    getDb()
      .select({ activeProducts: count() })
      .from(products)
      .where(eq(products.active, true)),
    getDb()
      .select({
        totalOrders: count(),
        totalRevenueCents: sum(orders.totalCents),
      })
      .from(orders),
  ])

  return {
    totalProducts: productStats[0]?.totalProducts ?? 0,
    activeProducts: activeProductStats[0]?.activeProducts ?? 0,
    totalOrders: orderStats[0]?.totalOrders ?? 0,
    totalRevenueCents: Number(orderStats[0]?.totalRevenueCents ?? 0),
  }
}
