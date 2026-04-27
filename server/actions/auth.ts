"use server"

import { redirect } from "next/navigation"
import { adminLoginSchema } from "@/lib/validators"
import { getEnv } from "@/lib/env"
import { setAdminCookie } from "@/lib/auth"

type LoginState = { error: string } | undefined

// Simple in-process rate limiter: max 5 attempts per IP per 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = attempts.get(ip)

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (record.count >= MAX_ATTEMPTS) return false

  record.count++
  return true
}

function clearAttempts(ip: string) {
  attempts.delete(ip)
}

export async function adminLogin(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const { headers } = await import("next/headers")
  const headersList = await headers()
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown"

  if (!checkRateLimit(ip)) {
    return { error: "Too many attempts. Please wait 15 minutes." }
  }

  const parsed = adminLoginSchema.safeParse({ password: formData.get("password") })
  if (!parsed.success) return { error: "Invalid input" }

  if (parsed.data.password !== getEnv().ADMIN_PASSWORD) {
    return { error: "Invalid password" }
  }

  clearAttempts(ip)
  await setAdminCookie()
  redirect("/admin")
}
