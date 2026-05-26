import { isIP } from "node:net"

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function firstForwardedValue(value: string | null): string | null {
  const candidate = value?.split(",")[0]?.trim()
  if (!candidate || candidate.toLowerCase() === "unknown") return null
  return candidate
}

function normalizeIp(value: string | null): string | null {
  const candidate = firstForwardedValue(value)
  if (!candidate) return null

  const unwrapped =
    candidate.startsWith("[") && candidate.includes("]")
      ? candidate.slice(1, candidate.indexOf("]"))
      : candidate
  const withoutPort =
    unwrapped.includes(":") && isIP(unwrapped) === 0
      ? unwrapped.slice(0, unwrapped.lastIndexOf(":"))
      : unwrapped

  return isIP(withoutPort) ? withoutPort : null
}

export function getClientIp(request: Request): string {
  const trustedHeaders = [
    "x-vercel-forwarded-for",
    "cf-connecting-ip",
    "true-client-ip",
    "x-real-ip",
  ]

  for (const header of trustedHeaders) {
    const ip = normalizeIp(request.headers.get(header))
    if (ip) return ip
  }

  return normalizeIp(request.headers.get("x-forwarded-for")) ?? "unknown"
}

export function isAllowedOrigin(request: Request, appUrl: string): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  try {
    const allowedOrigin = new URL(appUrl).origin
    if (origin) return new URL(origin).origin === allowedOrigin
    if (referer) return new URL(referer).origin === allowedOrigin
    return false
  } catch {
    return false
  }
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
  enforceInTests = false,
}: {
  key: string
  limit: number
  windowMs: number
  enforceInTests?: boolean
}): boolean {
  if (process.env.NODE_ENV === "test" && !enforceInTests) return true

  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    cleanupExpiredBuckets(now)
    return true
  }

  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}

export function resetRateLimit(key: string): void {
  buckets.delete(key)
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}
