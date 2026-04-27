import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for purchasing from jwld.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 lg:px-12 py-24 md:py-36">
      <div className="max-w-[680px] mx-auto">
        <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-10">
          Legal
        </p>

        <h1 className="text-lg font-light tracking-tight text-foreground mb-12">
          Terms of Service
        </h1>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              Orders
            </p>
            <p>
              All orders are subject to availability. We reserve the right to cancel orders in
              the event of stock discrepancies or payment failure. You will be notified by email
              and a full refund issued.
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              Returns &amp; Exchanges
            </p>
            <p>
              We accept returns within 14 days of delivery for unused items in original condition.
              Custom commissions are non-refundable once production has begun. To initiate a
              return, contact{" "}
              <a
                href="mailto:hello@jwld.store"
                className="text-foreground hover:text-foreground/70 transition-colors"
              >
                hello@jwld.store
              </a>
              .
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              Shipping
            </p>
            <p>
              Shipping costs are calculated at checkout. We are not responsible for delays caused
              by customs or third-party carriers. Risk of loss passes to you upon dispatch.
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              Custom Commissions
            </p>
            <p>
              Commission quotes are valid for 7 days. A non-refundable deposit may be required
              to begin production. Timelines are estimates only; we will communicate any changes
              promptly.
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              Governing Law
            </p>
            <p>These terms are governed by applicable law. Disputes shall be resolved in good faith before any legal proceedings.</p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              Contact
            </p>
            <p>
              <a
                href="mailto:hello@jwld.store"
                className="text-foreground hover:text-foreground/70 transition-colors"
              >
                hello@jwld.store
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
