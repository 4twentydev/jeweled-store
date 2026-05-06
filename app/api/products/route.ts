import { NextResponse } from "next/server"
import { getProducts } from "@/db/queries/products"

export async function GET() {
  const result = await getProducts()
  return NextResponse.json(result)
}
