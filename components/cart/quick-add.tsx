"use client"

import { Plus } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import type { Product } from "@/types"

type Props = {
  product: Pick<Product, "id" | "slug" | "name" | "priceCents" | "images" | "stock">
}

export function QuickAdd({ product }: Props) {
  const { addItem, openCart } = useCart()

  if (product.stock === 0) return null

  function handle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      image: product.images[0] ?? null,
      quantity: 1,
      maxStock: product.stock,
    })
    openCart()
  }

  return (
    <button
      onClick={handle}
      className="absolute bottom-3 right-3 size-8 flex items-center justify-center border border-border/50 bg-background/80 backdrop-blur-sm text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all opacity-0 group-hover:opacity-100 duration-200"
      aria-label={`Add ${product.name} to bag`}
    >
      <Plus className="size-3.5" />
    </button>
  )
}
