import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  isRateLimited: vi.fn().mockResolvedValue(false),
  recordAttempt: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://example.com" }),
}))

vi.mock("@/lib/db-rate-limit", () => ({
  isRateLimited: mocks.isRateLimited,
  recordAttempt: mocks.recordAttempt,
}))

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}))

import { POST } from "@/app/api/custom-request-upload/route"

function makeRequest(origin = "https://example.com") {
  return new Request("https://example.com/api/custom-request-upload", {
    method: "POST",
    headers: { origin, "x-forwarded-for": "203.0.113.10" },
    body: new FormData(),
  })
}

describe("POST /api/custom-request-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token"
    mocks.isRateLimited.mockResolvedValue(false)
  })

  it("rejects cross-origin uploads before rate-limit or file work", async () => {
    const res = await POST(makeRequest("https://attacker.example"))

    expect(res.status).toBe(403)
    expect((await res.json()).error).toMatch(/Invalid request origin/)
    expect(mocks.isRateLimited).not.toHaveBeenCalled()
    expect(mocks.recordAttempt).not.toHaveBeenCalled()
  })

  it("returns 429 when the upload bucket is exhausted before parsing files", async () => {
    mocks.isRateLimited.mockResolvedValue(true)

    const res = await POST(makeRequest())

    expect(res.status).toBe(429)
    expect((await res.json()).error).toMatch(/Too many uploads/)
    expect(mocks.recordAttempt).not.toHaveBeenCalled()
  })
})
