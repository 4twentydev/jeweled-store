"use server"

import { redirect } from "next/navigation"
import { adminLoginSchema } from "@/lib/validators"
import { getEnv } from "@/lib/env"
import { setAdminCookie } from "@/lib/auth"
import { adminLoginAttempts } from "@/db/schema"
import { clearAttempts, isRateLimited, recordAttempt } from "@/lib/db-rate-limit"

type LoginState = { error: string } | undefined

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

async function countRecentFailures(ip: string): Promise<number> {
  try {
    return (await isRateLimited(adminLoginAttempts, ip, MAX_ATTEMPTS, WINDOW_MS))
      ? MAX_ATTEMPTS
      : 0
  } catch {
    // DB unavailable — fail open to preserve admin access; rate limiting is defense-in-depth
    return 0
  }
}

async function recordFailure(ip: string): Promise<void> {
  try {
    await recordAttempt(adminLoginAttempts, ip, WINDOW_MS)
  } catch {
    // non-fatal — rate limit state is best-effort
  }
}

async function clearFailures(ip: string): Promise<void> {
  try {
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
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown"

  const failures = await countRecentFailures(ip)
  if (failures >= MAX_ATTEMPTS) {
    return { error: "Too many attempts. Please wait 15 minutes." }
  }

  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { error: "Invalid input" }

  if (parsed.data.email.trim().toLowerCase() !== getEnv().ADMIN_EMAIL.trim().toLowerCase()) {
    await recordFailure(ip)
    return { error: "Invalid credentials" }
  }

  const valid = await verifyPasswordConstantTime(parsed.data.password)
  if (!valid) {
    await recordFailure(ip)
    return { error: "Invalid credentials" }
  }

  await clearFailures(ip)
  await setAdminCookie(parsed.data.email)
  redirect("/admin")
}
