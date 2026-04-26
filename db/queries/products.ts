import { getDb } from "@/db"
import { products } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function getProducts() {
  return getDb().select().from(products).where(eq(products.active, true))
}

export async function getProductsByCategory(category: string) {
  return getDb()
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.category, category)))
}

export async function getFeaturedProducts(limit = 3) {
  return getDb()
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.featured, true)))
    .limit(limit)
}

export async function getProductBySlug(slug: string) {
  const [product] = await getDb()
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true)))
  return product ?? null
}
