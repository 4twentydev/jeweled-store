import { config } from "dotenv"
import { sql as drizzleSql } from "drizzle-orm"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "../db/schema"
import productCatalog from "../public/products/metadata/jwld_product_catalog.json"

config({ path: ".env.local", quiet: true })
config({ quiet: true })

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

type CatalogProduct = (typeof productCatalog)[number]

type ProductCategory = "Lighter" | "Container"
type SeedCatalogProduct = CatalogProduct & {
  category: ProductCategory
  priceCents?: number
  stock?: number
  featured?: boolean
}

const CATEGORY_MAP: Record<ProductCategory, string> = {
  Lighter: "bejeweled-lighters",
  Container: "small-cases",
}

const FEATURED_SKUS = new Set(["JWLD-001", "JWLD-002", "JWLD-015", "JWLD-018"])

function priceForProduct(product: SeedCatalogProduct) {
  return product.priceCents ?? (product.category === "Container" ? 1800 : 2800)
}

function imagePath(product: SeedCatalogProduct) {
  return `/products/${product.images.webp}`
}

async function seed() {
  if (process.env.NODE_ENV === "production") {
    console.error("ERROR: seed must not run against production. Aborting.")
    process.exit(1)
  }

  console.log("Upserting products from public/products/metadata/jwld_product_catalog.json...")

  const values = (productCatalog as SeedCatalogProduct[]).map((product) => ({
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: CATEGORY_MAP[product.category],
    priceCents: priceForProduct(product),
    images: [imagePath(product)],
    stock: product.stock ?? 1,
    featured: product.featured ?? FEATURED_SKUS.has(product.sku),
    active: true,
  }))

  const inserted = await db
    .insert(schema.products)
    .values(values)
    .onConflictDoUpdate({
      target: schema.products.slug,
      set: {
        name: drizzleSql`excluded.name`,
        description: drizzleSql`excluded.description`,
        category: drizzleSql`excluded.category`,
        priceCents: drizzleSql`excluded.price_cents`,
        images: drizzleSql`excluded.images`,
        stock: drizzleSql`excluded.stock`,
        featured: drizzleSql`excluded.featured`,
        active: drizzleSql`excluded.active`,
      },
    })
    .returning({ id: schema.products.id, name: schema.products.name })

  console.log(`Upserted ${inserted.length} products:`)
  for (const p of inserted) {
    console.log(`  ${p.name} (${p.id})`)
  }

  console.log("Done.")
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
