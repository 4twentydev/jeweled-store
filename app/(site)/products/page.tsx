import Link from "next/link"
import { FadeUp } from "@/components/fade-up"
import { ProductCard } from "@/components/product-card"
import { getProducts, getProductsByCategory } from "@/db/queries/products"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { slug: "bejeweled-lighters", label: "Lighters" },
  { slug: "lighter-cases", label: "Lighter Cases" },
  { slug: "small-cases", label: "Small Containers" },
  { slug: "lip-balms", label: "Lip Balms" },
  { slug: "lotions", label: "Lotions" },
  { slug: "custom-rhinestone-items", label: "Custom" },
]

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { category } = await searchParams
  const activeCategory = typeof category === "string" ? category : undefined

  const products = activeCategory
    ? await getProductsByCategory(activeCategory)
    : await getProducts()

  const activeCategoryLabel = activeCategory
    ? (CATEGORIES.find((c) => c.slug === activeCategory)?.label ?? "Products")
    : "All Products"

  return (
    <div className="min-h-screen px-6 lg:px-12 py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="mb-12 md:mb-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Catalog
          </p>
          <h1 className="text-lg font-light tracking-tight">{activeCategoryLabel}</h1>
        </FadeUp>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-12">
          <Link
            href="/products"
            className={cn(
              "text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-colors",
              !activeCategory
                ? "border-foreground text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground/70"
            )}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className={cn(
                "text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-colors",
                activeCategory === cat.slug
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground/70"
              )}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center border border-border/30">
            <p className="text-sm text-muted-foreground mb-6">
              No products found in this category.
            </p>
            <Link
              href="/products"
              className="text-[10px] tracking-[0.22em] uppercase text-foreground/50 hover:text-foreground transition-colors"
            >
              View all products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10">
            {products.map((product, i) => (
              <FadeUp key={product.id} delay={Math.min(i * 0.05, 0.3)}>
                <ProductCard product={product} />
              </FadeUp>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
