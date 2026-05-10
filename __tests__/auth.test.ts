import { describe, expect, it, vi } from "vitest"

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
