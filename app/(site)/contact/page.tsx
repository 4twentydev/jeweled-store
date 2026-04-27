import type { Metadata } from "next"
import { FadeUp } from "@/components/fade-up"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with jwld for enquiries, custom commissions, or wholesale.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen px-6 lg:px-12 py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto">
        <div className="max-w-[480px]">
          <FadeUp>
            <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-10">
              Contact
            </p>

            <h1
              className="font-light tracking-tight text-foreground leading-[1.06] mb-12"
              style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}
            >
              Get in Touch.
            </h1>

            <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/60 mb-2">
                  General Enquiries
                </p>
                <a
                  href="mailto:hello@jwld.store"
                  className="text-foreground hover:text-foreground/70 transition-colors"
                >
                  hello@jwld.store
                </a>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/60 mb-2">
                  Custom Commissions
                </p>
                <p className="mb-3">
                  For bespoke pieces, use the commission form — we respond within 48 hours.
                </p>
                <Link
                  href="/custom"
                  className="text-[10px] tracking-[0.28em] uppercase text-foreground border-b border-foreground/30 pb-0.5 hover:border-foreground/70 transition-colors"
                >
                  Start a Commission →
                </Link>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/60 mb-2">
                  Instagram
                </p>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-foreground/70 transition-colors"
                >
                  @jwld.store
                </a>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </div>
  )
}
