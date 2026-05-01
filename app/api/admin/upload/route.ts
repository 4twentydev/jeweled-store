import { put } from "@vercel/blob"
import { isAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file || !file.size) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "bin"
  const blob = await put(`products/${Date.now()}.${ext}`, file, { access: "public" })
  return NextResponse.json({ url: blob.url })
}
