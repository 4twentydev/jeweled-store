"use server"

import { getOrderByStripeSession } from "@/db/queries/orders"

export type SuccessOrder = {
  customerEmail: string | null
  customerName: string | null
  status: string
  totalCents: number
}

export async function lookupOrderBySession(sessionId: string): Promise<SuccessOrder | null> {
  if (!sessionId) return null
  const order = await getOrderByStripeSession(sessionId)
  if (!order) return null
  return {
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    status: order.status,
    totalCents: order.totalCents,
  }
}
