import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import sharp from "sharp"
import crypto from "crypto"
import { customRequestUploadAttempts } from "@/db/schema"
import { getEnv } from "@/lib/env"
import { isRateLimited, recordAttempt } from "@/lib/db-rate-limit"
import { getClientIp, isAllowedOrigin } from "@/lib/request-guards"

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
])

const MAX_BYTES = 10 * 1024 * 1024
const MAX_DIMENSION = 8000
const OUTPUT_DIMENSION = 1600
const OUTPUT_QUALITY = 84
const UPLOAD_LIMIT = 20
const UPLOAD_WINDOW_MS = 60 * 60 * 1000

function matchesMagicBytes(buf: Uint8Array, mimeType: string): boolean {
  switch (mimeType) {
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
    case "image/png":
      return (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
      )
    case "image/webp":
      return (
        buf[0] === 0x52 &&
        buf[1] === 0x49 &&
        buf[2] === 0x46 &&
        buf[3] === 0x46 &&
        buf[8] === 0x57 &&
        buf[9] === 0x45 &&
        buf[10] === 0x42 &&
        buf[11] === 0x50
      )
    case "image/gif":
      return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38
    case "image/avif":
      return buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70
    default:
      return false
  }
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req, getEnv().NEXT_PUBLIC_APP_URL)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Image storage is not configured" }, { status: 500 })
  }

  const ip = getClientIp(req)
  if (await isRateLimited(customRequestUploadAttempts, ip, UPLOAD_LIMIT, UPLOAD_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 }
    )
  }
  await recordAttempt(customRequestUploadAttempts, ip, UPLOAD_WINDOW_MS)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 })
  }

  const file = form.get("file") as File | null
  if (!file || !file.size) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 })
  }

  const declaredMime = file.type.toLowerCase().split(";")[0].trim()
  if (!ALLOWED_MIME_TYPES.has(declaredMime)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 })
  }

  let arrayBuf: ArrayBuffer
  try {
    arrayBuf = await file.arrayBuffer()
  } catch {
    return NextResponse.json({ error: "File could not be read" }, { status: 400 })
  }

  const buf = new Uint8Array(arrayBuf)
  if (!matchesMagicBytes(buf, declaredMime)) {
    return NextResponse.json(
      { error: "File content does not match declared type" },
      { status: 415 }
    )
  }

  let metadata: sharp.Metadata
  try {
    metadata = await sharp(Buffer.from(arrayBuf)).metadata()
  } catch {
    return NextResponse.json({ error: "File could not be decoded as an image" }, { status: 415 })
  }

  const { width = 0, height = 0 } = metadata
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return NextResponse.json(
      { error: `Image dimensions must not exceed ${MAX_DIMENSION}px` },
      { status: 422 }
    )
  }

  let optimized: Buffer
  try {
    optimized = await sharp(Buffer.from(arrayBuf))
      .rotate()
      .resize({
        width: OUTPUT_DIMENSION,
        height: OUTPUT_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: OUTPUT_QUALITY })
      .toBuffer()
  } catch (err) {
    console.error("[custom request upload] image optimization failed:", err)
    return NextResponse.json({ error: "Image optimization failed" }, { status: 422 })
  }

  const filename = `custom-requests/${crypto.randomUUID()}.webp`
  let blob: Awaited<ReturnType<typeof put>>
  try {
    blob = await put(filename, optimized, {
      access: "public",
      contentType: "image/webp",
    })
  } catch (err) {
    console.error("[custom request upload] blob put failed:", err)
    return NextResponse.json({ error: "Image upload failed" }, { status: 502 })
  }

  return NextResponse.json({ url: blob.url })
}
