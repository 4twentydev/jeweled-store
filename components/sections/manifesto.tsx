import { FadeUp } from "@/components/fade-up"

export function Manifesto() {
  return (
    <section className="py-24 md:py-36 px-6 lg:px-12 border-y border-border/40">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-8">
            Philosophy
          </p>
          <blockquote className="font-light leading-[1.5] text-foreground/85 max-w-2xl"
            style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.6rem)" }}
          >
            Every object we touch becomes something else entirely. Not just adorned — transformed.
            Rhinestones placed by hand, one by one, until the light has somewhere worthy to land.
          </blockquote>
        </FadeUp>
      </div>
    </section>
  )
}
