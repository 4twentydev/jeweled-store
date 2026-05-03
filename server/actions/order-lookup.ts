"use server"

import { getOrderByStripeSession } from "@/db/queries/orders"
import { getStripe } from "@/lib/stripe"
import crypto from "crypto"

export type SuccessOrder = {
  customerEmail: string | null
  customerName: string | null
  status: string
  totalCents: number
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf)
}

async function verifyLookupToken(sessionId: string, lookupToken?: string): Promise<boolean> {
  if (!lookupToken) return false
  if (!/^[A-Za-z0-9_-]{43}$/.test(lookupToken)) return false
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    const expected = session.metadata?.lookupToken
    return typeof expected === "string" && safeEqual(expected, lookupToken)
  } catch {
    return false
  }
}

export async function lookupOrderBySession(
  sessionId: string,
  lookupToken?: string
): Promise<SuccessOrder | null> {
  if (!sessionId || !(await verifyLookupToken(sessionId, lookupToken))) return null
  const order = await getOrderByStripeSession(sessionId)
  if (!order) return null
  return {
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    status: order.status,
    totalCents: order.totalCents,
  }
}
