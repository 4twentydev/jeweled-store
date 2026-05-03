"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { X, Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { SHIPPING_CENTS } from "@/lib/checkout"

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

export function CartSheet() {
  const { items, isOpen, closeCart, removeItem, setQuantity, subtotalCents, itemCount } =
    useCart()

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, closeCart])

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 z-[60] bg-black/60"
            aria-hidden
          />

          <motion.div
            key="sheet"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 h-full z-[70] w-full max-w-sm bg-[#0e0e0e] border-l border-border/40 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-border/40 shrink-0">
              <span className="text-[11px] tracking-[0.3em] uppercase text-foreground/80">
                Bag{" "}
                {itemCount > 0 && (
                  <span style={{ color: "var(--jwld-accent)" }}>({itemCount})</span>
                )}
              </span>
              <button
                onClick={closeCart}
                className="text-foreground/50 hover:text-foreground transition-colors"
                aria-label="Close cart"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                  <ShoppingBag className="size-8 text-foreground/20" />
                  <p className="text-sm text-muted-foreground tracking-wide">
                    Your bag is empty
                  </p>
                  <button
                    onClick={closeCart}
                    className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 hover:text-foreground transition-colors mt-2"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-border/30">
                  {items.map((item) => (
                    <li key={item.productId} className="px-6 py-5 flex gap-4">
                      <div className="relative w-16 h-16 shrink-0 overflow-hidden bg-[#1a1a1a]">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground/90 leading-snug truncate">
                          {item.name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">
                          {formatPrice(item.priceCents)}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center border border-border/50">
                            <button
                              onClick={() => setQuantity(item.productId, item.quantity - 1)}
                              className="px-2 py-1.5 text-foreground/50 hover:text-foreground transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="px-2 font-mono text-xs text-foreground/80 min-w-[1.75rem] text-center tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => setQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                              className="px-2 py-1.5 text-foreground/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground/60 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-6 border-t border-border/40 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="font-mono text-sm">{formatPrice(subtotalCents)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  Standard shipping {formatPrice(SHIPPING_CENTS)}
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full text-center py-3.5 text-[11px] tracking-[0.3em] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Checkout
                </Link>
                <button
                  onClick={closeCart}
                  className="block w-full text-center text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
