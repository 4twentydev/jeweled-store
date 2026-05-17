import { NextResponse } from "next/server"
import { getEnv } from "@/lib/env"
import {
  cleanupExpiredReservations,
  reconcileExpiredSessionReservations,
} from "@/lib/reservations"

export async function GET(request: Request) {
  const env = getEnv()
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "Cron is not configured" }, { status: 503 })
  }

  const authorization = request.headers.get("authorization")
  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await cleanupExpiredReservations()
  const result = await reconcileExpiredSessionReservations()
  return NextResponse.json({ ok: true, ...result })
}
