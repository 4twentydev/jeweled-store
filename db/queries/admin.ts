import { getDb } from "@/db"
import { products, orders, customRequests, notificationEvents } from "@/db/schema"
import { count, desc, eq, ilike, ne, or, sum } from "drizzle-orm"
import { cleanupExpiredReservations } from "@/lib/reservations"

export async function getAllProducts({
  page = 1,
  pageSize = 50,
  query,
}: {
  page?: number
  pageSize?: number
  query?: string
} = {}) {
  await cleanupExpiredReservations()
  const offset = Math.max(0, (page - 1) * pageSize)
  const filters = query?.trim()
    ? or(
        ilike(products.name, `%${query.trim()}%`),
        ilike(products.slug, `%${query.trim()}%`)
      )
    : undefined

  const queryBuilder = filters
    ? getDb().select().from(products).where(filters)
    : getDb().select().from(products)
  return queryBuilder.orderBy(desc(products.createdAt)).limit(pageSize).offset(offset)
}

export async function getProductById(id: string) {
  const [product] = await getDb().select().from(products).where(eq(products.id, id))
  return product ?? null
}

export async function getAllOrders({
  page = 1,
  pageSize = 50,
  query,
}: {
  page?: number
  pageSize?: number
  query?: string
} = {}) {
  const offset = Math.max(0, (page - 1) * pageSize)
  const filters = query?.trim()
    ? or(
        ilike(orders.customerEmail, `%${query.trim()}%`),
        ilike(orders.customerName, `%${query.trim()}%`),
        ilike(orders.stripeCheckoutSessionId, `%${query.trim()}%`)
      )
    : undefined

  const queryBuilder = filters
    ? getDb().select().from(orders).where(filters)
    : getDb().select().from(orders)
  return queryBuilder.orderBy(desc(orders.createdAt)).limit(pageSize).offset(offset)
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

export async function getAllCustomRequests({
  page = 1,
  pageSize = 50,
  query,
}: {
  page?: number
  pageSize?: number
  query?: string
} = {}) {
  const offset = Math.max(0, (page - 1) * pageSize)
  const filters = query?.trim()
    ? or(
        ilike(customRequests.customerEmail, `%${query.trim()}%`),
        ilike(customRequests.customerName, `%${query.trim()}%`),
        ilike(customRequests.itemDescription, `%${query.trim()}%`)
      )
    : undefined

  const queryBuilder = filters
    ? getDb().select().from(customRequests).where(filters)
    : getDb().select().from(customRequests)
  return queryBuilder.orderBy(desc(customRequests.createdAt)).limit(pageSize).offset(offset)
}

export async function getCustomRequestById(id: string) {
  const [request] = await getDb()
    .select()
    .from(customRequests)
    .where(eq(customRequests.id, id))
  return request ?? null
}

export async function getAdminStats() {
  const [productStats, activeProductStats, orderStats, revenueStats, pendingNotifications] = await Promise.all([
    getDb().select({ totalProducts: count() }).from(products),
    getDb()
      .select({ activeProducts: count() })
      .from(products)
      .where(eq(products.active, true)),
    getDb()
      .select({
        totalOrders: count(),
      })
      .from(orders),
    getDb()
      .select({
        totalRevenueCents: sum(orders.totalCents),
      })
      .from(orders)
      .where(ne(orders.status, "cancelled")),
    getDb()
      .select({ totalPendingNotifications: count() })
      .from(notificationEvents)
      .where(eq(notificationEvents.status, "pending")),
  ])

  return {
    totalProducts: productStats[0]?.totalProducts ?? 0,
    activeProducts: activeProductStats[0]?.activeProducts ?? 0,
    totalOrders: orderStats[0]?.totalOrders ?? 0,
    totalRevenueCents: Number(revenueStats[0]?.totalRevenueCents ?? 0),
    totalPendingNotifications: pendingNotifications[0]?.totalPendingNotifications ?? 0,
  }
}

export async function getRecentNotifications(limit = 10) {
  return getDb()
    .select()
    .from(notificationEvents)
    .orderBy(desc(notificationEvents.createdAt))
    .limit(limit)
}
