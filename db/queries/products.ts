import { getDb } from "@/db"
import { products } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getProducts() {
  return getDb().select().from(products)
}

export async function getProductBySlug(slug: string) {
  const [product] = await getDb()
    .select()
    .from(products)
    .where(eq(products.slug, slug))
  return product ?? null
}
