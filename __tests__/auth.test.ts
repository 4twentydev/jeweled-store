import { beforeEach, describe, expect, it, vi } from "vitest"

function setRequiredEnv(email: string) {
  process.env.DATABASE_URL = "postgres://user:pass@example.com:5432/db"
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder"
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_placeholder"
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder"
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
  process.env.ADMIN_EMAIL = email
  process.env.ADMIN_PASSWORD = "password"
  process.env.ADMIN_SECRET = "a".repeat(32)
}

describe("admin session tokens", () => {
  it("verifies tokens for admin emails containing dots", async () => {
    vi.resetModules()
    setRequiredEnv("owner.name@example.com")

    const { createSessionToken, verifySessionToken } = await import("@/lib/auth")

    const token = await createSessionToken("owner.name@example.com")

    expect(await verifySessionToken(token)).toBe(true)
  })
})

const actionMocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  setAdminCookie: vi.fn().mockResolvedValue(undefined),
  consumeRateLimit: vi.fn(),
  clearAttempts: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("next/navigation", () => ({
  redirect: actionMocks.redirect,
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}))

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")
  return {
    ...actual,
    setAdminCookie: actionMocks.setAdminCookie,
  }
})

vi.mock("@/lib/db-rate-limit", () => ({
  consumeRateLimit: actionMocks.consumeRateLimit,
  clearAttempts: actionMocks.clearAttempts,
}))

describe("adminLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRequiredEnv("owner@example.com")
  })

  it("falls back to the local limiter when the DB limiter throws", async () => {
    vi.resetModules()
    actionMocks.consumeRateLimit.mockRejectedValue(new Error("db unavailable"))
    const { adminLogin } = await import("@/server/actions/auth")

    const firstAttempt = await adminLogin(undefined, new FormData())
    expect(firstAttempt).toEqual({ error: "Invalid input" })

    const formData = new FormData()
    formData.set("email", "owner@example.com")
    formData.set("password", "wrong-password")

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(await adminLogin(undefined, formData)).toEqual({ error: "Invalid credentials" })
    }

    expect(await adminLogin(undefined, formData)).toEqual({
      error: "Too many attempts. Please wait 15 minutes.",
    })
  })

  it("clears the fallback limiter after a successful login", async () => {
    vi.resetModules()
    actionMocks.consumeRateLimit.mockRejectedValue(new Error("db unavailable"))
    const { adminLogin } = await import("@/server/actions/auth")

    const badForm = new FormData()
    badForm.set("email", "owner@example.com")
    badForm.set("password", "wrong-password")
    expect(await adminLogin(undefined, badForm)).toEqual({ error: "Invalid credentials" })

    const goodForm = new FormData()
    goodForm.set("email", "owner@example.com")
    goodForm.set("password", "password")

    actionMocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT")
    })

    await expect(adminLogin(undefined, goodForm)).rejects.toThrow("NEXT_REDIRECT")
    expect(actionMocks.setAdminCookie).toHaveBeenCalledWith("owner@example.com")

    actionMocks.redirect.mockReset()
    expect(await adminLogin(undefined, badForm)).toEqual({ error: "Invalid credentials" })
  })
})
