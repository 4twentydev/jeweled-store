import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { customRequestUploadAttempts } from "@/db/schema"
import { getEnv } from "@/lib/env"
import { isRateLimited, recordAttempt } from "@/lib/db-rate-limit"
import { getClientIp, isAllowedOrigin } from "@/lib/request-guards"
import { ImageUploadError, normalizeImageUpload } from "@/lib/image-upload"

const OUTPUT_QUALITY = 84
const UPLOAD_LIMIT = 20
const UPLOAD_WINDOW_MS = 60 * 60 * 1000

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

  let optimized: Buffer
  try {
    optimized = await normalizeImageUpload(file, { outputQuality: OUTPUT_QUALITY })
  } catch (err) {
    if (err instanceof ImageUploadError) {
      if (err.message === "Image optimization failed") {
        console.error("[custom request upload] image optimization failed:", err)
      }
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error("[custom request upload] image processing failed:", err)
    return NextResponse.json({ error: "Image processing failed" }, { status: 422 })
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
