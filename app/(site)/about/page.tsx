import type { Metadata } from "next"
import { FadeUp } from "@/components/fade-up"

export const metadata: Metadata = {
  title: "About",
  description:
    "jwld is a luxury bejeweled object studio. Every piece is hand-finished with rhinestone and precious-metal details.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen px-6 lg:px-12 py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto">
        <div className="max-w-[600px]">
          <FadeUp>
            <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-10">
              About
            </p>

            <h1
              className="font-light tracking-tight text-foreground leading-[1.06] mb-12"
              style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}
            >
              Ruthlessly Refined.
            </h1>

            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
              <p>
                jwld is a luxury object studio specialising in hand-applied rhinestone and
                precious-metal finishes. Every piece — whether a lighter, a case, or a custom
                commission — is finished by hand, one stone at a time.
              </p>
              <p>
                We work with a small, curated range of objects chosen for their geometry, their
                weight in the hand, and their capacity to carry detail. Nothing leaves the studio
                until the finish is exactly right.
              </p>
              <p>
                Custom commissions are open. Bring your own object or describe your vision — we
                will handle the rest.
              </p>
            </div>
          </FadeUp>
        </div>
      </div>
    </div>
  )
}
