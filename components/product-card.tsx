import Link from "next/link"
import type { Product } from "@/types"
import { QuickAdd } from "@/components/cart/quick-add"

const GRADIENT_MAP: Record<string, string> = {
  "bejeweled-lighters":
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(212,175,55,0.13) 0%, transparent 70%), #0e0e0e",
  "lighter-cases":
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(200,162,200,0.13) 0%, transparent 70%), #0e0e0e",
  "small-cases":
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(125,249,255,0.09) 0%, transparent 70%), #0e0e0e",
  "lip-balms":
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(255,92,168,0.11) 0%, transparent 70%), #0e0e0e",
  lotions:
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(255,92,168,0.11) 0%, transparent 70%), #0e0e0e",
}

const CATEGORY_LABEL: Record<string, string> = {
  "bejeweled-lighters": "Lighters",
  "lighter-cases": "Lighter Cases",
  "small-cases": "Small Cases",
  "lip-balms": "Lip Balms",
  lotions: "Lotions",
  "custom-rhinestone-items": "Custom",
}

const FALLBACK_BG =
  "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(247,244,239,0.05) 0%, transparent 70%), #0e0e0e"

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  const bg = GRADIENT_MAP[product.category] ?? FALLBACK_BG
  const categoryLabel = CATEGORY_LABEL[product.category] ?? product.category
  const badge =
    product.featured
      ? "Featured"
      : product.stock > 0 && product.stock <= 3
        ? "Low Stock"
        : undefined

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div
        className="relative aspect-square overflow-hidden mb-4"
        style={{ background: bg }}
      >
        {badge && (
          <span
            className="absolute top-3 left-3 text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 border"
            style={{
              color: "var(--jwld-accent)",
              borderColor: "var(--jwld-accent)",
            }}
          >
            {badge}
          </span>
        )}
        <div className="absolute inset-0 bg-white/[0.025] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <QuickAdd product={product} />
      </div>

      <div className="space-y-1">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          {categoryLabel}
        </p>
        <p className="text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-snug">
          {product.name}
        </p>
        <p className="font-mono text-sm text-muted-foreground">
          {formatPrice(product.priceCents)}
        </p>
      </div>
    </Link>
  )
}
