"use client"

import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

export default function CheckoutPage() {
  const { items, subtotalCents } = useCart()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6">
        <ShoppingBag className="size-10 text-foreground/20" />
        <p className="text-sm text-muted-foreground tracking-wide">Your bag is empty</p>
        <Link
          href="/products"
          className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 hover:text-foreground transition-colors"
        >
          Shop Now
        </Link>
      </div>
    )
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      })

      const data = (await res.json()) as { url?: string; error?: unknown }

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.")
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError("Unable to connect. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 lg:px-12 py-24 md:py-32">
      <div className="max-w-[780px] mx-auto">
        <h1 className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-12">
          Checkout
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-12 items-start">
          <form onSubmit={handleCheckout} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-transparent border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-[11px] tracking-[0.3em] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "Redirecting…" : "Continue to Payment"}
            </button>

            <p className="text-[10px] text-muted-foreground/60 text-center">
              You'll be redirected to Stripe's secure checkout.
            </p>
          </form>

          <div className="border border-border/40 p-5 space-y-4">
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Your Bag
            </h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-4">
                  <span className="text-sm text-foreground/70 truncate">
                    {item.name}
                    <span className="text-muted-foreground"> ×{item.quantity}</span>
                  </span>
                  <span className="font-mono text-xs shrink-0">
                    {formatPrice(item.priceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border/30 pt-3 flex justify-between items-center">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Subtotal
              </span>
              <span className="font-mono text-sm">{formatPrice(subtotalCents)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">Shipping at payment</p>
          </div>
        </div>
      </div>
    </div>
  )
}
