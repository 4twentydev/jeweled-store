import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn().mockResolvedValue(true),
  insertValues: vi.fn().mockResolvedValue([]),
  queueNotification: vi.fn().mockResolvedValue(undefined),
  processPendingNotifications: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/db", () => ({
  getDb: () => ({
    insert: () => ({ values: mocks.insertValues }),
  }),
}))

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_URL: "https://example.com",
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_NOTIFICATION_EMAIL: undefined,
  }),
}))

vi.mock("@/lib/db-rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}))

vi.mock("@/lib/notifications", () => ({
  queueNotification: mocks.queueNotification,
  processPendingNotifications: mocks.processPendingNotifications,
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { POST } from "@/app/api/custom-requests/route"

function makeRequest(body: unknown, origin = "https://example.com") {
  return new Request("https://example.com/api/custom-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin, "x-forwarded-for": "203.0.113.10" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/custom-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.consumeRateLimit.mockResolvedValue(true)
    mocks.insertValues.mockResolvedValue([])
  })

  it("returns a readable validation error instead of a flattened Zod object", async () => {
    const res = await POST(
      makeRequest({
        customerName: "A",
        customerEmail: "buyer@example.com",
        itemDescription: "Too short",
        budgetRange: "25",
        referenceImages: [],
      })
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe("Enter your name.")
    expect(json.fieldErrors.customerName).toEqual(["Enter your name."])
    expect(json.fieldErrors.itemDescription).toEqual([
      "Tell us a little more about the object or vision.",
    ])
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
    expect(mocks.insertValues).not.toHaveBeenCalled()
  })

  it("rate limits only after the request body is valid", async () => {
    mocks.consumeRateLimit.mockResolvedValue(false)

    const res = await POST(
      makeRequest({
        customerName: "Test Buyer",
        customerEmail: "buyer@example.com",
        itemDescription: "Please make a crystal lighter case with pink accents.",
        budgetRange: "35",
        referenceImages: [],
      })
    )

    expect(res.status).toBe(429)
    expect((await res.json()).error).toBe("Too many requests. Please try again later.")
    expect(mocks.consumeRateLimit).toHaveBeenCalledOnce()
    expect(mocks.insertValues).not.toHaveBeenCalled()
  })

  it("trims text fields and stores a valid custom request", async () => {
    const res = await POST(
      makeRequest({
        customerName: "  Test Buyer  ",
        customerEmail: "  buyer@example.com  ",
        itemDescription: "  Please make a crystal lighter case with pink accents.  ",
        budgetRange: "35",
        referenceImages: [],
      })
    )

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ ok: true })
    expect(mocks.insertValues).toHaveBeenCalledWith({
      customerName: "Test Buyer",
      customerEmail: "buyer@example.com",
      itemDescription: "Please make a crystal lighter case with pink accents.",
      budgetRange: "35",
      referenceImages: [],
    })
  })
})
