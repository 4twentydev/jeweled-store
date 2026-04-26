import Link from "next/link"
import type { PlaceholderProduct } from "@/lib/placeholder-data"

const GRADIENT_MAP: Record<string, string> = {
  lighters:
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(212,175,55,0.13) 0%, transparent 70%), #0e0e0e",
  "lighter-cases":
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(200,162,200,0.13) 0%, transparent 70%), #0e0e0e",
  "small-cases":
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(125,249,255,0.09) 0%, transparent 70%), #0e0e0e",
  beauty:
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(255,92,168,0.11) 0%, transparent 70%), #0e0e0e",
  custom:
    "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(247,244,239,0.05) 0%, transparent 70%), #0e0e0e",
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

type Props = {
  product: PlaceholderProduct
}

export function ProductCard({ product }: Props) {
  const bg = GRADIENT_MAP[product.category] ?? GRADIENT_MAP.custom

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* Image placeholder */}
      <div
        className="relative aspect-square overflow-hidden mb-4"
        style={{ background: bg }}
      >
        {product.badge && (
          <span
            className="absolute top-3 left-3 text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 border"
            style={{
              color: "var(--jwld-accent)",
              borderColor: "var(--jwld-accent)",
            }}
          >
            {product.badge}
          </span>
        )}
        {/* Hover shimmer */}
        <div className="absolute inset-0 bg-white/[0.025] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Meta */}
      <div className="space-y-1">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          {product.categoryLabel}
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
