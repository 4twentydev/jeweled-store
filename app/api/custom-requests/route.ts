import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getDb } from "@/db"
import { customRequests } from "@/db/schema"
import { customRequestSchema } from "@/lib/validators"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = customRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { customerName, customerEmail, itemDescription, budgetRange, referenceImages } = parsed.data

  await getDb().insert(customRequests).values({
    customerName,
    customerEmail,
    itemDescription,
    budgetRange,
    referenceImages,
  })

  revalidatePath("/admin")
  revalidatePath("/admin/custom-requests")

  return NextResponse.json({ ok: true }, { status: 201 })
}
