import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn().mockResolvedValue(true),
  put: vi.fn(),
}))

vi.mock("@/lib/db-rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}))

vi.mock("@vercel/blob", () => ({
  put: mocks.put,
}))

import { POST } from "@/app/api/custom-request-upload/route"
import sharp from "sharp"

function makeRequest(origin = "https://example.com", form = new FormData()) {
  return new Request("https://example.com/api/custom-request-upload", {
    method: "POST",
    headers: { origin, "x-forwarded-for": "203.0.113.10" },
    body: form,
  })
}

describe("POST /api/custom-request-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token"
    mocks.consumeRateLimit.mockResolvedValue(true)
    mocks.put.mockResolvedValue({ url: "https://blob.example/custom.webp" })
  })

  it("rejects cross-origin uploads before rate-limit or file work", async () => {
    const res = await POST(makeRequest("https://attacker.example"))

    expect(res.status).toBe(403)
    expect((await res.json()).error).toMatch(/Invalid request origin/)
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
  })

  it("rejects uploads with no origin or referer before rate-limit or file work", async () => {
    const res = await POST(
      new Request("https://example.com/api/custom-request-upload", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.10" },
        body: new FormData(),
      })
    )

    expect(res.status).toBe(403)
    expect((await res.json()).error).toMatch(/Invalid request origin/)
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
  })

  it("returns 429 when the upload bucket is exhausted before parsing files", async () => {
    mocks.consumeRateLimit.mockResolvedValue(false)

    const res = await POST(makeRequest())

    expect(res.status).toBe(429)
    expect((await res.json()).error).toMatch(/Too many uploads/)
  })

  it("falls back to local rate limiting when the DB limiter is unavailable", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.consumeRateLimit.mockRejectedValueOnce(new Error("relation does not exist"))

    const res = await POST(makeRequest())

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("No file provided")
    expect(consoleError).toHaveBeenCalledWith(
      "[custom request upload] db rate limit unavailable:",
      expect.any(Error)
    )
    consoleError.mockRestore()
  })

  it("normalizes and uploads a valid image", async () => {
    const png = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: "#ffffff",
      },
      })
      .png()
      .toBuffer()
    const pngBytes = new Uint8Array(png.length)
    pngBytes.set(png)
    const form = new FormData()
    form.append("file", new File([pngBytes], "reference.png", { type: "image/png" }))

    const res = await POST(makeRequest("https://example.com", form))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: "https://blob.example/custom.webp" })
    expect(mocks.put).toHaveBeenCalledWith(
      expect.stringMatching(/^custom-requests\/.+\.webp$/),
      expect.any(Buffer),
      expect.objectContaining({ access: "public", contentType: "image/webp" })
    )
  })
})
