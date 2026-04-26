import Link from "next/link"
import { FadeUp } from "@/components/fade-up"
import { ProductCard } from "@/components/product-card"
import { PLACEHOLDER_PRODUCTS } from "@/lib/placeholder-data"

export function FeaturedProducts() {
  const products = PLACEHOLDER_PRODUCTS.slice(0, 3)

  return (
    <section className="py-24 md:py-32 px-6 lg:px-12 bg-card">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="flex items-end justify-between mb-12 md:mb-16">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
              Featured — 001
            </p>
            <h2 className="text-lg font-light tracking-tight">Standout Pieces</h2>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline text-[10px] tracking-[0.22em] uppercase text-foreground/50 hover:text-foreground transition-colors"
          >
            View All →
          </Link>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
          {products.map((product, i) => (
            <FadeUp key={product.id} delay={i * 0.1}>
              <ProductCard product={product} />
            </FadeUp>
          ))}
        </div>

        <div className="mt-10 md:hidden">
          <Link
            href="/shop"
            className="text-[10px] tracking-[0.22em] uppercase text-foreground/50 hover:text-foreground transition-colors"
          >
            View All →
          </Link>
        </div>
      </div>
    </section>
  )
}
