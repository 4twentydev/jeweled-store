"use client"

import { ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"

export function CartButton() {
  const { itemCount, openCart } = useCart()

  return (
    <button
      onClick={openCart}
      aria-label="Open cart"
      className="flex items-center gap-1.5 text-foreground/60 hover:text-foreground transition-colors"
    >
      <ShoppingBag className="size-[17px]" />
      <span
        className="text-[10px] font-mono tabular-nums leading-none"
        style={{ color: "var(--jwld-accent)" }}
      >
        {itemCount}
      </span>
    </button>
  )
}
