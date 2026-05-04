import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import crypto from "crypto"
import sharp from "sharp"
import { isAdmin } from "@/lib/auth"
import { PRODUCT_CATEGORIES, productFormSchema } from "@/lib/validators"

export const maxDuration = 60

const OPENAI_API_URL = "https://api.openai.com/v1"
const MAX_FILES = 4
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_REFERENCE_DIMENSION = 1536

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
])

type DraftProduct = {
  name: string
  slug: string
  description: string
  category: string
  priceInDollars: number
  stock: number
  featured: boolean
  active: boolean
}

type PreparedReference = {
  blob: Blob
  dataUrl: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function getOpenAIHeaders(contentType = "application/json") {
  return {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": contentType,
  }
}

async function prepareReference(file: File): Promise<PreparedReference> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Each image must be 10 MB or smaller")
  }

  const mimeType = file.type.toLowerCase().split(";")[0].trim()
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error("Upload JPG, PNG, WebP, or AVIF product photos")
  }

  const input = Buffer.from(await file.arrayBuffer())
  const webp = await sharp(input, { animated: false })
    .rotate()
    .resize({
      width: MAX_REFERENCE_DIMENSION,
      height: MAX_REFERENCE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88 })
    .toBuffer()

  const bytes = new Uint8Array(webp.length)
  bytes.set(webp)

  return {
    blob: new Blob([bytes], { type: "image/webp" }),
    dataUrl: `data:image/webp;base64,${webp.toString("base64")}`,
  }
}

function collectOutputText(value: unknown): string {
  if (!value || typeof value !== "object") return ""
  if ("output_text" in value && typeof value.output_text === "string") {
    return value.output_text
  }
  if ("text" in value && typeof value.text === "string") return value.text
  if (Array.isArray(value)) return value.map(collectOutputText).join("")
  return Object.values(value).map(collectOutputText).join("")
}

async function generateMetadata(references: PreparedReference[]): Promise<DraftProduct> {
  const categories = PRODUCT_CATEGORIES.map((cat) => cat.value)
  const response = await fetch(`${OPENAI_API_URL}/responses`, {
    method: "POST",
    headers: getOpenAIHeaders(),
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL ?? "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "You create product records for JWLD, a boutique handmade rhinestone accessory store.",
                "Analyze the uploaded messy product photo(s). If there are multiple products, describe the strongest single sellable item or cohesive set shown.",
                "Return a concise ecommerce product draft in the store's existing voice.",
                "Pricing guidance: bejeweled lighters are usually $28, small containers are usually $18, lip balms/lotions are lower unless heavily decorated, and elaborate custom rhinestone items can be higher.",
                `Use exactly one category from: ${categories.join(", ")}.`,
                "Use stock 1 unless the image clearly shows a matched set being sold together.",
              ].join(" "),
            },
            ...references.map((reference) => ({
              type: "input_image",
              image_url: reference.dataUrl,
              detail: "high",
            })),
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "jwld_product_draft",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "description",
              "category",
              "priceInDollars",
              "stock",
              "featured",
              "active",
            ],
            properties: {
              name: {
                type: "string",
              },
              description: {
                type: "string",
              },
              category: {
                type: "string",
                enum: categories,
              },
              priceInDollars: {
                type: "number",
              },
              stock: {
                type: "integer",
              },
              featured: {
                type: "boolean",
              },
              active: {
                type: "boolean",
              },
            },
          },
        },
      },
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error("[ai product] metadata failed:", response.status, body)
    throw new Error("AI could not create product details")
  }

  const text = collectOutputText(body)
  const parsed = JSON.parse(text) as Omit<DraftProduct, "slug">
  return {
    ...parsed,
    slug: slugify(parsed.name),
    priceInDollars: Math.round(parsed.priceInDollars * 100) / 100,
  }
}

async function generateCatalogImage(references: PreparedReference[], draft: DraftProduct) {
  const form = new FormData()
  form.append("model", process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1")
  form.append("size", "1024x1024")
  form.append("quality", "medium")
  form.append(
    "prompt",
    [
      `Create a clean luxury ecommerce product photo of this handmade JWLD product: ${draft.name}.`,
      `Product description: ${draft.description}`,
      "Use the uploaded photo(s) as strict visual reference for product shape, colors, stones, beads, charms, letters, and decoration placement.",
      "Center the product upright on a warm off-white studio background with soft diffused lighting, realistic shadow beneath it, sharp crystal/bead detail, and minimalist boutique product-card styling.",
      "Square 1:1 composition. No hands, no text overlay, no watermark, no clutter, no extra props. Keep the product accurate to the reference photo.",
    ].join(" ")
  )

  references.forEach((reference, index) => {
    form.append("image", reference.blob, `reference-${index + 1}.webp`)
  })

  const response = await fetch(`${OPENAI_API_URL}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: form,
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error("[ai product] image failed:", response.status, body)
    throw new Error("AI could not create the product image")
  }

  const b64 = body?.data?.[0]?.b64_json
  if (typeof b64 !== "string") {
    throw new Error("AI image response did not include image data")
  }

  return Buffer.from(b64, "base64")
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI is not configured. Add OPENAI_API_KEY." },
      { status: 500 }
    )
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage is not configured" },
      { status: 500 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 })
  }

  const files = form
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, MAX_FILES)

  if (!files.length) {
    return NextResponse.json({ error: "Upload at least one product photo" }, { status: 400 })
  }

  try {
    const references = await Promise.all(files.map(prepareReference))
    const draft = await generateMetadata(references)
    const productImage = await generateCatalogImage(references, draft)
    const webpImage = await sharp(productImage)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer()

    const filename = `products/${crypto.randomUUID()}-${draft.slug || "ai-product"}.webp`
    const blob = await put(filename, webpImage, {
      access: "public",
      contentType: "image/webp",
    })

    const parsed = productFormSchema.safeParse({
      ...draft,
      images: [blob.url],
    })

    if (!parsed.success) {
      console.error("[ai product] generated invalid draft:", parsed.error.flatten())
      throw new Error("AI created product details that did not pass validation")
    }

    return NextResponse.json({ product: parsed.data })
  } catch (err) {
    console.error("[ai product] failed:", err)
    const message = err instanceof Error ? err.message : "AI product generation failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
