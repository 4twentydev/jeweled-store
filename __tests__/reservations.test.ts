import { beforeEach, describe, expect, it, vi } from "vitest"

const UUID1 = "110e8400-e29b-41d4-a716-446655440001"

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  update: vi.fn(),
  reservationUpdateSet: vi.fn(),
  reservationUpdateWhere: vi.fn(),
  reservationReleaseReturning: vi.fn(),
  productUpdateSet: vi.fn(),
  productUpdateWhere: vi.fn(),
}))

vi.mock("@/db", () => ({
  getDb: () => ({
    transaction: mocks.transaction,
  }),
}))

import { cleanupExpiredReservations } from "@/lib/reservations"

describe("cleanupExpiredReservations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.reservationUpdateWhere.mockReturnValue({
      returning: mocks.reservationReleaseReturning,
    })
    mocks.reservationUpdateSet.mockReturnValue({ where: mocks.reservationUpdateWhere })
    mocks.productUpdateWhere.mockResolvedValue([])
    mocks.productUpdateSet.mockReturnValue({ where: mocks.productUpdateWhere })
    mocks.update.mockImplementation((table: Record<string, unknown>) => {
      if ("stock" in table) return { set: mocks.productUpdateSet }
      return { set: mocks.reservationUpdateSet }
    })
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ update: mocks.update })
    )
  })

  it("does not restore stock when no expired reservation rows are atomically claimed", async () => {
    mocks.reservationReleaseReturning.mockResolvedValue([])

    await cleanupExpiredReservations()

    expect(mocks.reservationReleaseReturning).toHaveBeenCalledOnce()
    expect(mocks.productUpdateSet).not.toHaveBeenCalled()
  })

  it("restores stock only for reservation rows returned by the release update", async () => {
    mocks.reservationReleaseReturning.mockResolvedValue([
      { id: "reservation-1", productId: UUID1, quantity: 2 },
    ])

    await cleanupExpiredReservations()

    expect(mocks.reservationReleaseReturning).toHaveBeenCalledOnce()
    expect(mocks.productUpdateSet).toHaveBeenCalledOnce()
    expect(mocks.productUpdateWhere).toHaveBeenCalledOnce()
  })
})
