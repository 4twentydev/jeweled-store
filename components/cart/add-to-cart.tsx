"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import type { Product } from "@/types"

type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const [qty, setQty] = useState(1)
  const { addItem, openCart } = useCart()

  if (product.stock === 0) return null

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      image: product.images[0] ?? null,
      quantity: qty,
      maxStock: product.stock,
    })
    openCart()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center border border-border/50 w-fit">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          className="px-3 py-2.5 text-foreground/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Decrease quantity"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="px-4 font-mono text-sm text-foreground/80 min-w-[3rem] text-center tabular-nums">
          {qty}
        </span>
        <button
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          disabled={qty >= product.stock}
          className="px-3 py-2.5 text-foreground/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Increase quantity"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <button
        onClick={handleAdd}
        className="flex items-center justify-center gap-3 w-full max-w-md py-3.5 text-[11px] tracking-[0.3em] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        <ShoppingBag className="size-3.5" />
        Add to Bag
      </button>
    </div>
  )
}
