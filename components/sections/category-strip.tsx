import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { FadeUp } from "@/components/fade-up"
import { PLACEHOLDER_CATEGORIES } from "@/lib/placeholder-data"

export function CategoryStrip() {
  return (
    <section className="py-24 md:py-32 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="flex items-baseline justify-between mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Browse
          </p>
          <Link
            href="/products"
            className="text-[10px] tracking-[0.22em] uppercase text-foreground/50 hover:text-foreground transition-colors"
          >
            Shop All →
          </Link>
        </FadeUp>

        <FadeUp delay={0.05}>
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px"
            style={{ backgroundColor: "rgba(255,255,255,0.065)" }}
          >
            {PLACEHOLDER_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className={cn(
                  "group relative flex flex-col justify-end p-6 lg:p-8 overflow-hidden min-h-[200px] lg:min-h-[300px]"
                )}
              >
                <Image
                  src={cat.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 17vw"
                  className="object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-85"
                />
                <div className="absolute inset-0 bg-black/45" />
                {/* Base gradient */}
                <div
                  className="absolute inset-0 mix-blend-screen"
                  style={{ background: `${cat.gradient}, #050505` }}
                />
                {/* Hover intensification */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: cat.hoverGradient }}
                />

                <div className="relative z-10">
                  <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground group-hover:text-foreground/50 transition-colors mb-1.5">
                    {cat.description}
                  </p>
                  <p className="text-sm tracking-[0.12em] uppercase text-foreground">
                    {cat.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
