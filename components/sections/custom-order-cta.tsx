import Link from "next/link"
import { FadeUp } from "@/components/fade-up"

export function CustomOrderCta() {
  return (
    <section className="relative py-32 md:py-48 px-6 lg:px-12 overflow-hidden">
      {/* Slightly deeper background */}
      <div className="absolute inset-0 bg-[#030303]" />

      {/* Accent corner bloom — uses color-mix for opacity on the dynamic accent */}
      <div
        className="absolute top-0 right-0 w-2/3 h-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 100% 0%, color-mix(in srgb, var(--jwld-accent) 7%, transparent) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto">
        <FadeUp>
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-8">
            Bespoke Commission
          </p>
          <h2
            className="font-light tracking-tight text-foreground leading-[1.06] mb-7 max-w-md"
            style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}
          >
            Something<br />Entirely Yours.
          </h2>
          <p className="text-sm text-muted-foreground mb-12 max-w-xs leading-relaxed">
            Bring your own object or describe your vision. We apply every stone by hand
            until it&apos;s exactly what you imagined.
          </p>
          <Link
            href="/custom"
            className="group inline-flex items-center gap-4 border border-foreground/20 px-8 py-4 text-[11px] tracking-[0.28em] uppercase hover:border-foreground/45 transition-colors duration-300"
          >
            Start a Commission
            <span className="transition-transform duration-300 group-hover:translate-x-1.5">
              →
            </span>
          </Link>
        </FadeUp>
      </div>
    </section>
  )
}
