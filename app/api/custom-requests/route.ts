import { NextResponse } from "next/server"
import { z } from "zod"
import { getDb } from "@/db"
import { customRequests } from "@/db/schema"

const schema = z.object({
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  itemDescription: z.string().min(10).max(2000),
  budgetRange: z.string().min(1).max(50),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { customerName, customerEmail, itemDescription, budgetRange } = parsed.data

  await getDb().insert(customRequests).values({
    customerName,
    customerEmail,
    itemDescription,
    budgetRange,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
