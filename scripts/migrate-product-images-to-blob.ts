import { readFile } from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { config } from "dotenv"
import { put } from "@vercel/blob"
import { eq } from "drizzle-orm"
import sharp from "sharp"
import { getDb } from "../db"
import { products } from "../db/schema"

config({ path: ".env.local", quiet: true })
config({ quiet: true })

const OUTPUT_DIMENSION = 1600
const OUTPUT_QUALITY = 86
const dryRun = process.argv.includes("--dry-run")

function isLocalProductImage(value: string) {
  return value.startsWith("/products/")
}

function localFilePath(src: string) {
  return path.join(process.cwd(), "public", decodeURIComponent(src.replace(/^\/+/, "")))
}

function blobFilename(src: string) {
  const parsed = path.parse(src)
  const safeName = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90) || "product-image"

  return `products/migrated/${safeName}-${crypto.randomUUID()}.webp`
}

async function optimizeImage(file: Buffer) {
  return sharp(file)
    .rotate()
    .resize({
      width: OUTPUT_DIMENSION,
      height: OUTPUT_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: OUTPUT_QUALITY })
    .toBuffer()
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required")
  }

  const db = getDb()
  const rows = await db
    .select({ id: products.id, slug: products.slug, images: products.images })
    .from(products)

  const uploaded = new Map<string, string>()
  let updatedProducts = 0
  let migratedImages = 0
  const missing: string[] = []

  for (const product of rows) {
    let changed = false
    const nextImages: string[] = []

    for (const image of product.images) {
      if (!isLocalProductImage(image)) {
        nextImages.push(image)
        continue
      }

      if (uploaded.has(image)) {
        nextImages.push(uploaded.get(image)!)
        changed = true
        continue
      }

      const filePath = localFilePath(image)
      let original: Buffer
      try {
        original = await readFile(filePath)
      } catch {
        missing.push(`${product.slug}: ${image}`)
        nextImages.push(image)
        continue
      }

      if (dryRun) {
        nextImages.push(`blob:${blobFilename(image)}`)
        changed = true
        continue
      }

      const optimized = await optimizeImage(original)
      const blob = await put(blobFilename(image), optimized, {
        access: "public",
        contentType: "image/webp",
      })

      uploaded.set(image, blob.url)
      nextImages.push(blob.url)
      migratedImages += 1
      changed = true
    }

    if (!changed || dryRun) {
      if (changed) updatedProducts += 1
      continue
    }

    await db
      .update(products)
      .set({ images: nextImages })
      .where(eq(products.id, product.id))
    updatedProducts += 1
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        updatedProducts,
        migratedImages,
        missing,
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
