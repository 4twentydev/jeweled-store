import { NextResponse } from "next/server"
import { getOrderByStripeSession } from "@/db/queries/orders"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const order = await getOrderByStripeSession(sessionId)
  return NextResponse.json({
    order: order
      ? {
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          status: order.status,
          totalCents: order.totalCents,
        }
      : null,
  })
}
