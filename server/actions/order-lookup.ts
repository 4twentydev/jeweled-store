"use server"

import { getOrderBySessionAndLookupToken } from "@/db/queries/orders"

export type SuccessOrder = {
  customerEmail: string | null
  customerName: string | null
  status: string
  totalCents: number
}

export async function lookupOrderBySession(
  sessionId: string,
  lookupToken?: string
): Promise<SuccessOrder | null> {
  if (!sessionId || !lookupToken || !/^[A-Za-z0-9_-]{43}$/.test(lookupToken)) return null
  const order = await getOrderBySessionAndLookupToken(sessionId, lookupToken)
  if (!order) return null
  return {
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    status: order.status,
    totalCents: order.totalCents,
  }
}
