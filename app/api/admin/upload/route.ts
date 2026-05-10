import { put } from "@vercel/blob"
import { isAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { ImageUploadError, normalizeImageUpload } from "@/lib/image-upload"

const OUTPUT_QUALITY = 86

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage is not configured" },
      { status: 500 }
    )
  }

  const form = await req.formData()
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
        console.error("[admin upload] image optimization failed:", err)
      }
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error("[admin upload] image processing failed:", err)
    return NextResponse.json({ error: "Image processing failed" }, { status: 422 })
  }

  const filename = `products/${crypto.randomUUID()}.webp`

  let blob: Awaited<ReturnType<typeof put>>
  try {
    blob = await put(filename, optimized, {
      access: "public",
      contentType: "image/webp",
    })
  } catch (err) {
    console.error("[admin upload] blob put failed:", err)
    return NextResponse.json(
      { error: "Image upload failed" },
      { status: 502 }
    )
  }

  return NextResponse.json({ url: blob.url })
}
