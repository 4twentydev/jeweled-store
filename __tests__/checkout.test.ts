import { vi, describe, it, expect, beforeEach } from "vitest"

// Must be proper RFC 4122 UUIDs (version digit = 4, variant = 8/9/a/b)
// because Zod v4's z.string().uuid() is strict about this.
const UUID1 = "110e8400-e29b-41d4-a716-446655440001"

// vi.hoisted creates mocks before module-level vi.mock calls are hoisted,
// so they're accessible both in factories and in test bodies.
const mocks = vi.hoisted(() => ({
  selectWhere: vi.fn(),
  sessionCreate: vi.fn(),
  transaction: vi.fn(),
  updateWhere: vi.fn(),
  updateSet: vi.fn(),
  insertValues: vi.fn(),
  insert: vi.fn(),
  reservationUpdateWhere: vi.fn(),
  reservationUpdateSet: vi.fn(),
  dbUpdateWhere: vi.fn(),
  decrementReturning: vi.fn(),
}))

vi.mock("@/db", () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: mocks.selectWhere }) }),
    transaction: mocks.transaction,
    update: () => ({ set: mocks.reservationUpdateSet }),
  }),
}))

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: mocks.sessionCreate } },
  }),
}))

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://example.com" }),
  getCheckoutEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://example.com", STRIPE_SECRET_KEY: "sk_test" }),
}))

vi.mock("@/lib/db-rate-limit", () => ({
  isRateLimited: vi.fn().mockResolvedValue(false),
  recordAttempt: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/reservations", () => ({
  cleanupExpiredReservations: vi.fn().mockResolvedValue(undefined),
  createReservationToken: vi.fn().mockReturnValue("reservation-token"),
  getReservationExpiry: vi.fn().mockReturnValue(new Date("2026-01-01T00:30:00.000Z")),
}))

import { POST } from "@/app/api/checkout/route"

const fakeProduct = {
  id: UUID1,
  name: "Test Lighter",
  priceCents: 4999,
  stock: 10,
  active: true,
  images: [] as string[],
}

function makeRequest(body: unknown) {
  return new Request("https://example.com/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.sessionCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://stripe.com/checkout/test",
    })
    mocks.insertValues.mockResolvedValue([])
    mocks.insert.mockReturnValue({ values: mocks.insertValues })
    mocks.decrementReturning.mockResolvedValue([{ id: UUID1 }])
    mocks.updateWhere.mockReturnValue({ returning: mocks.decrementReturning })
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere })
    mocks.reservationUpdateSet.mockReturnValue({ where: mocks.dbUpdateWhere })
    mocks.dbUpdateWhere.mockResolvedValue([])
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        update: () => ({ set: mocks.updateSet }),
        insert: mocks.insert,
      })
    )
  })

  it("rejects invalid JSON", async () => {
    const req = new Request("https://example.com/api/checkout", {
      method: "POST",
      body: "not-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Invalid JSON")
  })

  it("rejects missing email", async () => {
    const res = await POST(makeRequest({ items: [{ productId: UUID1, quantity: 1 }] }))
    expect(res.status).toBe(400)
  })

  it("rejects invalid email format", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", items: [{ productId: UUID1, quantity: 1 }] }))
    expect(res.status).toBe(400)
  })

  it("rejects empty items array", async () => {
    const res = await POST(makeRequest({ email: "test@example.com", items: [] }))
    expect(res.status).toBe(400)
  })

  it("rejects quantity of zero", async () => {
    const res = await POST(makeRequest({
      email: "test@example.com",
      items: [{ productId: UUID1, quantity: 0 }],
    }))
    expect(res.status).toBe(400)
  })

  it("rejects unknown product (not in DB or inactive)", async () => {
    mocks.selectWhere.mockResolvedValue([])
    const res = await POST(makeRequest({ email: "test@example.com", items: [{ productId: UUID1, quantity: 1 }] }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/not found/)
  })

  it("rejects insufficient stock", async () => {
    mocks.selectWhere.mockResolvedValue([{ ...fakeProduct, stock: 2 }])
    const res = await POST(makeRequest({ email: "test@example.com", items: [{ productId: UUID1, quantity: 5 }] }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Insufficient stock/)
  })

  it("aggregates duplicate productIds before stock check", async () => {
    // Two line-items for the same product totaling qty 5; stock is only 4
    mocks.selectWhere.mockResolvedValue([{ ...fakeProduct, stock: 4 }])
    const res = await POST(makeRequest({
      email: "test@example.com",
      items: [
        { productId: UUID1, quantity: 3 },
        { productId: UUID1, quantity: 2 },
      ],
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Insufficient stock/)
  })

  it("creates Stripe session and returns checkout url on success", async () => {
    mocks.selectWhere.mockResolvedValue([fakeProduct])
    const res = await POST(makeRequest({ email: "test@example.com", items: [{ productId: UUID1, quantity: 1 }] }))
    expect(res.status).toBe(200)
    expect((await res.json()).url).toBe("https://stripe.com/checkout/test")
    expect(mocks.sessionCreate).toHaveBeenCalledOnce()
  })

  it("forwards customer_email and correct line-item amounts to Stripe", async () => {
    mocks.selectWhere.mockResolvedValue([fakeProduct])
    await POST(makeRequest({ email: "buyer@example.com", items: [{ productId: UUID1, quantity: 2 }] }))
    const call = mocks.sessionCreate.mock.calls[0][0]
    expect(call.customer_email).toBe("buyer@example.com")
    expect(call.line_items[0].price_data.unit_amount).toBe(4999)
    expect(call.line_items[0].quantity).toBe(2)
  })

  it("aggregates quantities in Stripe metadata when same product appears twice", async () => {
    mocks.selectWhere.mockResolvedValue([fakeProduct])
    await POST(makeRequest({
      email: "test@example.com",
      items: [
        { productId: UUID1, quantity: 1 },
        { productId: UUID1, quantity: 2 },
      ],
    }))
    const call = mocks.sessionCreate.mock.calls[0][0]
    expect(call.line_items).toHaveLength(1)
    expect(call.line_items[0].quantity).toBe(3)
    const metadata = JSON.parse(call.metadata.items) as { quantity: number }[]
    expect(metadata[0].quantity).toBe(3)
  })
})
