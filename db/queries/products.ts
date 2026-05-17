import { getDb } from "@/db"
import { products, type ProductCategory } from "@/db/schema"
import { eq, and, ne, desc } from "drizzle-orm"

export async function getProducts() {
  return getDb()
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(desc(products.createdAt))
}

export async function getProductsByCategory(category: ProductCategory) {
  return getDb()
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.category, category)))
    .orderBy(desc(products.createdAt))
}

export async function getFeaturedProducts(limit = 3) {
  return getDb()
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.featured, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit)
}

export async function getProductBySlug(slug: string) {
  const [product] = await getDb()
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true)))
  return product ?? null
}

export async function getRelatedProducts(category: ProductCategory, excludeId: string, limit = 4) {
  return getDb()
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.category, category), ne(products.id, excludeId)))
    .orderBy(desc(products.createdAt))
    .limit(limit)
}
