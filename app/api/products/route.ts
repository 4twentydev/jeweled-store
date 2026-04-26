import { NextResponse } from "next/server"
import { getDb } from "@/db"
import { products } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const result = await getDb()
    .select()
    .from(products)
    .where(eq(products.active, true))
  return NextResponse.json(result)
}
