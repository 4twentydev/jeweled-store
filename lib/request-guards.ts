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
  if (!origin) return true

  try {
    return new URL(origin).origin === new URL(appUrl).origin
  } catch {
    return false
  }
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string
  limit: number
  windowMs: number
}): boolean {
  if (process.env.NODE_ENV === "test") return true

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

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}
