import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "../db/schema"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

const seedProducts: (typeof schema.products.$inferInsert)[] = [
  // Lighters
  {
    slug: "noir-obsidian-lighter",
    name: "Noir Obsidian Lighter",
    description:
      "Fully encrusted in jet-black Swarovski crystals. Each stone hand-placed over a premium windproof lighter body. The result is pure, unapologetic darkness.",
    category: "lighters",
    priceCents: 28500,
    images: [],
    stock: 4,
    featured: true,
    active: true,
  },
  {
    slug: "aurora-rose-lighter",
    name: "Aurora Rose Lighter",
    description:
      "Rose-toned AB crystals catch the light at every angle. A gradient from deep blush to pale champagne, applied by hand over a brushed silver base.",
    category: "lighters",
    priceCents: 32000,
    images: [],
    stock: 3,
    featured: false,
    active: true,
  },
  // Lighter Cases
  {
    slug: "pave-crystal-sleeve",
    name: "Pavé Crystal Sleeve",
    description:
      "An interchangeable sleeve in full pavé rhinestone coverage. Fits standard Bic and Clipper lighters. Changes the entire register of an everyday object.",
    category: "lighter-cases",
    priceCents: 18500,
    images: [],
    stock: 8,
    featured: false,
    active: true,
  },
  {
    slug: "gold-mesh-lighter-case",
    name: "Gold Mesh Case",
    description:
      "Woven metallic gold mesh with scattered clear crystals at the intersections. Lightweight and flexible. Clips on and off in seconds.",
    category: "lighter-cases",
    priceCents: 22000,
    images: [],
    stock: 6,
    featured: false,
    active: true,
  },
  // Small Cases
  {
    slug: "vanity-pill-box",
    name: "Vanity Pill Box",
    description:
      "An oval pill box in fully bejeweled rhodium-plated brass. Crystal lid, satin interior. Discreet enough for a pocket, striking enough for a table.",
    category: "small-cases",
    priceCents: 14500,
    images: [],
    stock: 10,
    featured: false,
    active: true,
  },
  {
    slug: "slim-crystal-cardholder",
    name: "Slim Crystal Cardholder",
    description:
      "Holds up to six cards. Exterior in tightly packed clear and silver crystals. A deliberate object that does a simple thing with extreme precision.",
    category: "small-cases",
    priceCents: 16500,
    images: [],
    stock: 7,
    featured: false,
    active: true,
  },
  // Beauty
  {
    slug: "crystal-lip-balm",
    name: "Crystal Lip Balm",
    description:
      "A refillable lip balm dispenser in solid crystal-encrusted brass. The cap is a single large clear stone. Comes with a nourishing unscented balm.",
    category: "beauty",
    priceCents: 9500,
    images: [],
    stock: 15,
    featured: false,
    active: true,
  },
  {
    slug: "glam-lotion-wand",
    name: "Glam Lotion Wand",
    description:
      "A travel-size lotion roller in crystal-trimmed aluminum. Cooling metal roller head, crystal-banded grip. Refillable. Made to be seen on a vanity.",
    category: "beauty",
    priceCents: 12000,
    images: [],
    stock: 12,
    featured: false,
    active: true,
  },
]

async function seed() {
  console.log("Seeding products...")

  await db.delete(schema.products)

  const inserted = await db
    .insert(schema.products)
    .values(seedProducts)
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
