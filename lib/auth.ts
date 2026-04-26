import { cookies } from "next/headers"
import { getEnv } from "@/lib/env"

export const ADMIN_COOKIE = "jwld_admin"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getEnv().ADMIN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

async function signValue(value: string): Promise<string> {
  const key = await getSigningKey()
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function verifyValue(value: string, sig: string): Promise<boolean> {
  const key = await getSigningKey()
  let sigBytes: ArrayBuffer
  try {
    const base64 = sig.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(base64)
    sigBytes = Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer
  } catch {
    return false
  }
  return crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(value))
}

// Token format: `admin:{issuedAt}.{hmac}` — no dots in the payload so indexOf(".") is unambiguous
export async function createSessionToken(): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000)
  const value = `admin:${issuedAt}`
  const sig = await signValue(value)
  return `${value}.${sig}`
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const dot = token.indexOf(".")
  if (dot === -1) return false
  const value = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  if (!value.startsWith("admin:")) return false
  const issuedAt = parseInt(value.slice("admin:".length), 10)
  if (isNaN(issuedAt)) return false
  const now = Math.floor(Date.now() / 1000)
  if (now - issuedAt > COOKIE_MAX_AGE) return false

  return verifyValue(value, sig)
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  if (!token) return false
  return verifySessionToken(token)
}

export async function setAdminCookie(): Promise<void> {
  const token = await createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  })
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
}
