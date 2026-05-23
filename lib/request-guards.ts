type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
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
