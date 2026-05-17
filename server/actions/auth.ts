"use server"

import { redirect } from "next/navigation"
import { adminLoginSchema } from "@/lib/validators"
import { getEnv } from "@/lib/env"
import { setAdminCookie } from "@/lib/auth"
import { adminLoginAttempts } from "@/db/schema"
import { clearAttempts, consumeRateLimit } from "@/lib/db-rate-limit"

type LoginState = { error: string } | undefined

function getClientIp(headersList: Headers): string | null {
  const candidates = [
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim(),
    headersList.get("x-real-ip")?.trim(),
    headersList.get("cf-connecting-ip")?.trim(),
    headersList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim(),
  ]

  for (const candidate of candidates) {
    if (!candidate || candidate.toLowerCase() === "unknown") continue
    return candidate
  }

  return null
}

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

// HMAC-based constant-time password comparison — eliminates timing oracle on the raw string
async function verifyPasswordConstantTime(submitted: string): Promise<boolean> {
  const { ADMIN_SECRET, ADMIN_PASSWORD } = getEnv()
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ADMIN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, new TextEncoder().encode(submitted)),
    crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ADMIN_PASSWORD)),
  ])
  const a = new Uint8Array(sigA)
  const b = new Uint8Array(sigB)
  // SHA-256 HMAC is always 32 bytes — no variable-length short-circuit possible
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

async function consumeLoginAttempt(ip: string | null): Promise<boolean> {
  try {
    if (!ip) return true
    return consumeRateLimit(adminLoginAttempts, ip, MAX_ATTEMPTS, WINDOW_MS)
  } catch {
    // DB unavailable — fail open to preserve admin access; rate limiting is defense-in-depth
    return true
  }
}

async function clearFailures(ip: string | null): Promise<void> {
  try {
    if (!ip) return
    await clearAttempts(adminLoginAttempts, ip)
  } catch {
    // non-fatal
  }
}

export async function adminLogin(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const { headers } = await import("next/headers")
  const headersList = await headers()
  const ip = getClientIp(headersList)

  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { error: "Invalid input" }

  const allowed = await consumeLoginAttempt(ip)
  if (!allowed) {
    return { error: "Too many attempts. Please wait 15 minutes." }
  }

  if (parsed.data.email.trim().toLowerCase() !== getEnv().ADMIN_EMAIL.trim().toLowerCase()) {
    return { error: "Invalid credentials" }
  }

  const valid = await verifyPasswordConstantTime(parsed.data.password)
  if (!valid) {
    return { error: "Invalid credentials" }
  }

  await clearFailures(ip)
  await setAdminCookie(parsed.data.email)
  redirect("/admin")
}
