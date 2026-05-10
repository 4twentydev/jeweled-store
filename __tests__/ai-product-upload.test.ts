import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({
  isAdmin: vi.fn().mockResolvedValue(true),
}))

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}))

import { POST } from "@/app/api/admin/ai-product/route"

function makeRequest(file: File) {
  const form = new FormData()
  form.append("files", file)
  return new Request("https://example.com/api/admin/ai-product", {
    method: "POST",
    body: form,
  })
}

describe("POST /api/admin/ai-product", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
    process.env.OPENAI_API_KEY = "sk-test"
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token"
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("rejects files whose bytes do not match the declared image type before calling OpenAI", async () => {
    const file = new File(["not a jpeg"], "fake.jpg", { type: "image/jpeg" })

    const res = await POST(makeRequest(file))

    expect(res.status).toBe(415)
    expect((await res.json()).error).toMatch(/content does not match declared type/)
    expect(fetch).not.toHaveBeenCalled()
  })
})
