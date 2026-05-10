import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { getProductBySlug, getRelatedProducts } from "@/db/queries/products"
import { AddToCart } from "@/components/cart/add-to-cart"
import { ProductCard } from "@/components/product-card"
import { ProductDetailAccordions } from "@/components/product-detail-accordions"
import { ProductGallery } from "@/components/product-gallery"

export const dynamic = "force-dynamic"

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
  "small-cases": "Small Containers",
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: "Product Not Found" }
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const bg = GRADIENT_MAP[product.category] ?? FALLBACK_BG
  const categoryLabel = CATEGORY_LABEL[product.category] ?? product.category
  const relatedProducts = await getRelatedProducts(product.category, product.id)

  return (
    <div className="min-h-screen px-6 lg:px-12 pt-24 pb-32 md:py-32">
      <div className="max-w-[1400px] mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-12 flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          <Link href="/products" className="hover:text-foreground transition-colors">
            Shop
          </Link>
          <span>/</span>
          <Link
            href={`/products?category=${product.category}`}
            className="hover:text-foreground transition-colors"
          >
            {categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-foreground/50">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <ProductGallery images={product.images} name={product.name} background={bg} />

          {/* Product info */}
          <div className="flex flex-col">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              {categoryLabel}
            </p>

            <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-4">
              {product.name}
            </h1>

            <p className="font-mono text-xl mb-8">{formatPrice(product.priceCents)}</p>

            <p className="text-sm text-foreground/70 leading-relaxed mb-8 max-w-md">
              {product.description}
            </p>

            <div className="mb-8 max-w-md">
              <ProductDetailAccordions category={product.category} />
            </div>

            {product.stock === 0 ? (
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Out of stock
              </p>
            ) : (
              <>
                {product.stock <= 5 && (
                  <p
                    className="text-[10px] tracking-[0.2em] uppercase mb-6"
                    style={{ color: "var(--jwld-accent)" }}
                  >
                    Only {product.stock} left
                  </p>
                )}
                <AddToCart product={product} />
              </>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-24 md:mt-32">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                  Complementary Pieces
                </p>
                <h2 className="text-lg font-light tracking-tight">Also in {categoryLabel}</h2>
              </div>
              <Link
                href={`/products?category=${product.category}`}
                className="hidden md:inline text-[10px] tracking-[0.22em] uppercase text-foreground/50 hover:text-foreground transition-colors"
              >
                View Category
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
