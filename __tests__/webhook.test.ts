import { vi, describe, it, expect, beforeEach } from "vitest"

// Must be proper RFC 4122 UUIDs — Zod v4's z.string().uuid() validates version/variant bits.
const UUID1 = "110e8400-e29b-41d4-a716-446655440001"
const SESSION_ID = "cs_test_abc123"
const ORDER_ITEM = { productId: UUID1, quantity: 1, priceCents: 5000 }

const mocks = vi.hoisted(() => {
  const insertValues = vi.fn().mockResolvedValue([])
  const decrementReturning = vi.fn().mockResolvedValue([{ id: "110e8400-e29b-41d4-a716-446655440001" }])
  const updateWhere = vi.fn().mockReturnValue({ returning: decrementReturning })
  const updateSet = vi.fn().mockReturnValue({ where: updateWhere })
  const insert = vi.fn().mockReturnValue({ values: insertValues })
  const update = vi.fn().mockReturnValue({ set: updateSet })
  const transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({ insert, update })
  )

  return {
    selectWhere: vi.fn(),
    insert,
    insertValues,
    update,
    updateSet,
    updateWhere,
    decrementReturning,
    transaction,
    constructEvent: vi.fn(),
  }
})

vi.mock("@/db", () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: mocks.selectWhere }) }),
    transaction: mocks.transaction,
    update: mocks.update,
    insert: mocks.insert,
  }),
}))

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mocks.constructEvent },
  }),
}))

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ STRIPE_WEBHOOK_SECRET: "whsec_test" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { POST } from "@/app/api/stripe/webhook/route"

// --- Helpers ---

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    payment_intent: "pi_test_xxx",
    customer_email: "buyer@example.com",
    customer_details: {
      name: "Test Buyer",
      address: {
        line1: "1 Main St",
        line2: null,
        city: "Springfield",
        state: "IL",
        postal_code: "62701",
        country: "US",
      },
    },
    amount_total: ORDER_ITEM.priceCents * ORDER_ITEM.quantity,
    metadata: { items: JSON.stringify([ORDER_ITEM]) },
    ...overrides,
  }
}

function makeEvent(session = makeSession()) {
  return { type: "checkout.session.completed", data: { object: session } }
}

function makeRequest(body = "raw-body", signature = "stripe-sig") {
  return new Request("https://example.com/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body,
  })
}

// Wire sequential select responses: first call is the idempotency check
// (orders table), second is the products fetch.
function setupSelects(existingOrder: boolean, productList: unknown[]) {
  let calls = 0
  mocks.selectWhere.mockImplementation(() =>
    Promise.resolve(calls++ === 0 ? (existingOrder ? [{ id: "existing-id" }] : []) : productList)
  )
}

// ---

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.insert.mockReturnValue({ values: mocks.insertValues })
    mocks.insertValues.mockResolvedValue([])
    mocks.decrementReturning.mockResolvedValue([{ id: UUID1 }])
    mocks.updateWhere.mockReturnValue({ returning: mocks.decrementReturning })
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere })
    mocks.update.mockReturnValue({ set: mocks.updateSet })
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ insert: mocks.insert, update: mocks.update })
    )
  })

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new Request("https://example.com/api/stripe/webhook", {
      method: "POST",
      body: "body",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Missing stripe-signature/)
  })

  it("returns 400 when signature verification fails", async () => {
    mocks.constructEvent.mockImplementation(() => { throw new Error("Bad sig") })
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Invalid signature/)
  })

  it("returns 200 for non-checkout events without touching the DB", async () => {
    mocks.constructEvent.mockReturnValue({ type: "payment_intent.succeeded", data: { object: {} } })
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  describe("duplicate delivery", () => {
    it("fast path: skips transaction entirely when session was already processed", async () => {
      mocks.constructEvent.mockReturnValue(makeEvent())
      setupSelects(true, [])
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect((await res.json()).received).toBe(true)
      expect(mocks.transaction).not.toHaveBeenCalled()
    })

    it("concurrent path: swallows unique-constraint violation and returns 200", async () => {
      mocks.constructEvent.mockReturnValue(makeEvent())
      setupSelects(false, [{ id: UUID1, slug: "test", active: true, stock: 10 }])
      const err = Object.assign(new Error("duplicate key value"), { code: "23505" })
      mocks.transaction.mockRejectedValueOnce(err)
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect((await res.json()).received).toBe(true)
    })
  })

  describe("metadata validation", () => {
    it("returns 400 for unparseable metadata JSON", async () => {
      mocks.constructEvent.mockReturnValue(makeEvent(makeSession({ metadata: { items: "bad-json" } })))
      const res = await POST(makeRequest())
      expect(res.status).toBe(400)
    })

    it("returns 400 when amount_total mismatches computed metadata total", async () => {
      mocks.constructEvent.mockReturnValue(makeEvent(makeSession({ amount_total: 9999 })))
      const res = await POST(makeRequest())
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/mismatch/)
    })
  })

  describe("cancelled order behavior", () => {
    it("inserts order as cancelled (no decrements) when product is out of stock", async () => {
      mocks.constructEvent.mockReturnValue(makeEvent())
      setupSelects(false, [{ id: UUID1, slug: "test", active: true, stock: 0 }])
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mocks.transaction).toHaveBeenCalledOnce()
      expect(mocks.update).not.toHaveBeenCalled()
      expect(mocks.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ status: "cancelled" })
      )
    })

    it("inserts order as cancelled when product is inactive", async () => {
      mocks.constructEvent.mockReturnValue(makeEvent())
      setupSelects(false, [{ id: UUID1, slug: "test", active: false, stock: 10 }])
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mocks.transaction).toHaveBeenCalledOnce()
      expect(mocks.update).not.toHaveBeenCalled()
      expect(mocks.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ status: "cancelled" })
      )
    })
  })

  describe("low-stock concurrency", () => {
    it("rolls back decrement transaction and inserts cancelled order when gte guard fires", async () => {
      mocks.constructEvent.mockReturnValue(makeEvent())
      setupSelects(false, [{ id: UUID1, slug: "test", active: true, stock: 10 }])
      mocks.decrementReturning.mockResolvedValueOnce([])
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mocks.transaction).toHaveBeenCalledTimes(2)
      expect(mocks.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ status: "cancelled" })
      )
    })

    it("inserts new order when decrement succeeds", async () => {
      mocks.constructEvent.mockReturnValue(makeEvent())
      setupSelects(false, [{ id: UUID1, slug: "test", active: true, stock: 10 }])
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mocks.transaction).toHaveBeenCalledOnce()
      expect(mocks.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ status: "new" })
      )
    })

    it("happy path: processes payment in one transaction", async () => {
      mocks.constructEvent.mockReturnValue(makeEvent())
      setupSelects(false, [{ id: UUID1, slug: "lighter-01", active: true, stock: 5 }])
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mocks.transaction).toHaveBeenCalledOnce()
      expect(mocks.update).toHaveBeenCalledOnce()
    })
  })
})
