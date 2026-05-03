import { vi, describe, it, expect, beforeEach } from "vitest"

const mocks = vi.hoisted(() => ({
  getOrderByStripeSession: vi.fn(),
  retrieveSession: vi.fn(),
}))

vi.mock("@/db/queries/orders", () => ({
  getOrderByStripeSession: mocks.getOrderByStripeSession,
}))

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { retrieve: mocks.retrieveSession } },
  }),
}))

import { lookupOrderBySession } from "@/server/actions/order-lookup"

const LOOKUP_TOKEN = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO12"

const fakeDbOrder = {
  id: "order-uuid-1",
  stripeCheckoutSessionId: "cs_test_xxx",
  stripePaymentIntentId: "pi_test_xxx",
  customerEmail: "buyer@example.com",
  customerName: "Test Buyer",
  status: "new",
  totalCents: 5000,
  shipping: null,
  createdAt: new Date(),
}

describe("lookupOrderBySession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.retrieveSession.mockResolvedValue({ metadata: { lookupToken: LOOKUP_TOKEN } })
  })

  it("returns null for empty sessionId without querying the DB", async () => {
    const result = await lookupOrderBySession("", LOOKUP_TOKEN)
    expect(result).toBeNull()
    expect(mocks.getOrderByStripeSession).not.toHaveBeenCalled()
  })

  it("returns null when lookup token is missing or invalid", async () => {
    expect(await lookupOrderBySession("cs_test_xxx")).toBeNull()
    expect(await lookupOrderBySession("cs_test_xxx", "wrong-token")).toBeNull()
    expect(mocks.getOrderByStripeSession).not.toHaveBeenCalled()
  })

  it("returns null when webhook has not yet created the order", async () => {
    mocks.getOrderByStripeSession.mockResolvedValue(null)
    const result = await lookupOrderBySession("cs_test_xxx", LOOKUP_TOKEN)
    expect(result).toBeNull()
  })

  it("returns a shaped SuccessOrder when found", async () => {
    mocks.getOrderByStripeSession.mockResolvedValue(fakeDbOrder)
    const result = await lookupOrderBySession("cs_test_xxx", LOOKUP_TOKEN)
    expect(result).toEqual({
      customerEmail: "buyer@example.com",
      customerName: "Test Buyer",
      status: "new",
      totalCents: 5000,
    })
  })

  it("does not leak internal DB fields (id, stripeCheckoutSessionId, etc.)", async () => {
    mocks.getOrderByStripeSession.mockResolvedValue(fakeDbOrder)
    const result = await lookupOrderBySession("cs_test_xxx", LOOKUP_TOKEN)
    expect(result).not.toHaveProperty("id")
    expect(result).not.toHaveProperty("stripeCheckoutSessionId")
    expect(result).not.toHaveProperty("stripePaymentIntentId")
    expect(result).not.toHaveProperty("shipping")
    expect(result).not.toHaveProperty("createdAt")
  })

  it("handles null customer fields gracefully", async () => {
    mocks.getOrderByStripeSession.mockResolvedValue({
      ...fakeDbOrder,
      customerEmail: null,
      customerName: null,
    })
    const result = await lookupOrderBySession("cs_test_xxx", LOOKUP_TOKEN)
    expect(result?.customerEmail).toBeNull()
    expect(result?.customerName).toBeNull()
  })

  describe("polling simulation", () => {
    it("reflects state after webhook creates the order on a second call", async () => {
      mocks.getOrderByStripeSession
        .mockResolvedValueOnce(null)         // poll 1: webhook not yet delivered
        .mockResolvedValueOnce(fakeDbOrder)  // poll 2: webhook processed

      expect(await lookupOrderBySession("cs_test_xxx", LOOKUP_TOKEN)).toBeNull()
      const order = await lookupOrderBySession("cs_test_xxx", LOOKUP_TOKEN)
      expect(order?.status).toBe("new")
    })

    it("reflects a subsequent status transition (e.g. new → shipped)", async () => {
      mocks.getOrderByStripeSession
        .mockResolvedValueOnce(fakeDbOrder)
        .mockResolvedValueOnce({ ...fakeDbOrder, status: "shipped" })

      expect((await lookupOrderBySession("cs_test_xxx", LOOKUP_TOKEN))?.status).toBe("new")
      expect((await lookupOrderBySession("cs_test_xxx", LOOKUP_TOKEN))?.status).toBe("shipped")
    })
  })
})
