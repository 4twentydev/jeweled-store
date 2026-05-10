import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COOKIE_NAME = "jwld_admin"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false

  // Token format: `admin:{issuedAt}:{email}.{hmac}`
  const dot = token.lastIndexOf(".")
  if (dot === -1) return false
  const value = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const [prefix, issuedAtValue, email] = value.split(":")
  if (prefix !== "admin" || !email) return false
  if (email !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) return false
  const issuedAt = parseInt(issuedAtValue ?? "", 10)
  if (isNaN(issuedAt)) return false
  const now = Math.floor(Date.now() / 1000)
  if (now - issuedAt > MAX_AGE) return false

  let key: CryptoKey
  try {
    key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )
  } catch {
    return false
  }

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/admin")) return NextResponse.next()
  if (pathname === "/admin/login") return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.redirect(new URL("/admin/login", request.url))

  const valid = await verifyToken(token)
  if (!valid) return NextResponse.redirect(new URL("/admin/login", request.url))

  return NextResponse.next()
}

export const config = {
  matcher: "/admin/:path*",
}
