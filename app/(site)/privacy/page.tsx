import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How jwld collects, uses, and protects your personal information.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 lg:px-12 py-24 md:py-36">
      <div className="max-w-[680px] mx-auto">
        <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-10">
          Legal
        </p>

        <h1 className="text-lg font-light tracking-tight text-foreground mb-12">
          Privacy Policy
        </h1>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              Information We Collect
            </p>
            <p>
              When you place an order, we collect your name, email address, and shipping address
              through Stripe&apos;s secure checkout. We do not store your payment card details — all
              payment processing is handled by Stripe, Inc.
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              How We Use Your Information
            </p>
            <p>
              We use your information solely to fulfil your order, communicate order status, and
              respond to custom commission enquiries. We do not sell or share your personal data
              with third parties except as required to process payments and deliver orders.
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              Cookies
            </p>
            <p>
              We use session cookies to maintain your shopping cart. No tracking or advertising
              cookies are used.
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-3">
              Data Retention
            </p>
            <p>
              Order records are retained for accounting and legal purposes. You may request
              deletion of your personal data by emailing{" "}
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
              Contact
            </p>
            <p>
              Questions about this policy?{" "}
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
