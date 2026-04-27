import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "../db/schema"
import seedData from "./seed-products.json"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function seed() {
  if (process.env.NODE_ENV === "production") {
    console.error("ERROR: seed must not run against production. Aborting.")
    process.exit(1)
  }

  console.log("Seeding products from seed-products.json...")

  await db.delete(schema.products)

  const values = seedData.map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.long_description,
    category: p.category.replace(/\s+/g, "-").toLowerCase(),
    priceCents: p.price_in_cents,
    images: [] as string[],
    stock: p.stock,
    featured: p.featured,
    active: true,
  }))

  const inserted = await db
    .insert(schema.products)
    .values(values)
    .returning({ id: schema.products.id, name: schema.products.name })

  console.log(`Inserted ${inserted.length} products:`)
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
