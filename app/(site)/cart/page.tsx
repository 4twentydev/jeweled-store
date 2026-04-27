"use client"

import Link from "next/link"
import { Minus, Plus, X, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

export default function CartPage() {
  const { items, removeItem, setQuantity, subtotalCents } = useCart()

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

  return (
    <div className="min-h-screen px-6 lg:px-12 py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-12">
          Your Bag
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16 items-start">
          {/* Items */}
          <ul className="divide-y divide-border/30">
            {items.map((item) => (
              <li key={item.productId} className="py-8 flex gap-6">
                <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 bg-[#1a1a1a]" />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link
                        href={`/product/${item.slug}`}
                        className="text-sm text-foreground/90 hover:text-foreground transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        {formatPrice(item.priceCents)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-foreground/30 hover:text-foreground transition-colors shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="flex items-center border border-border/50 w-fit mt-4">
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="px-3 py-2 text-foreground/50 hover:text-foreground transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="px-3 font-mono text-xs text-foreground/80 min-w-[2rem] text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="px-3 py-2 text-foreground/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>

                <p className="font-mono text-sm text-foreground/70 shrink-0 pt-0.5">
                  {formatPrice(item.priceCents * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <div className="lg:sticky lg:top-24">
            <div className="border border-border/40 p-6 space-y-5">
              <h2 className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                Order Summary
              </h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatPrice(subtotalCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Shipping</span>
                <span className="text-[10px] tracking-[0.1em] text-muted-foreground/60">
                  Calculated at checkout
                </span>
              </div>
              <div className="border-t border-border/30 pt-4 flex justify-between items-center">
                <span className="text-[11px] tracking-[0.2em] uppercase">Total</span>
                <span className="font-mono">{formatPrice(subtotalCents)}</span>
              </div>
              <Link
                href="/checkout"
                className="block w-full text-center py-3.5 text-[11px] tracking-[0.3em] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Checkout
              </Link>
              <Link
                href="/products"
                className="block w-full text-center text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
