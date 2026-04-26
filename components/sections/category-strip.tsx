import Link from "next/link"
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
            href="/shop"
            className="text-[10px] tracking-[0.22em] uppercase text-foreground/50 hover:text-foreground transition-colors"
          >
            Shop All →
          </Link>
        </FadeUp>

        <FadeUp delay={0.05}>
          {/* Asymmetric grid — first tile is 2-wide on large screens */}
          <div
            className="grid grid-cols-2 lg:grid-cols-5 gap-px"
            style={{ backgroundColor: "rgba(255,255,255,0.065)" }}
          >
            {PLACEHOLDER_CATEGORIES.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className={cn(
                  "group relative flex flex-col justify-end p-6 lg:p-8 overflow-hidden min-h-[200px] lg:min-h-[300px]",
                  i === 0 && "col-span-2 min-h-[260px] lg:min-h-[360px]"
                )}
              >
                {/* Base gradient */}
                <div
                  className="absolute inset-0"
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
