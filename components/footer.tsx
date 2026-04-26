import Link from "next/link"

const SHOP_LINKS = [
  { label: "Lighters", href: "/shop?category=lighters" },
  { label: "Lighter Cases", href: "/shop?category=lighter-cases" },
  { label: "Small Cases", href: "/shop?category=small-cases" },
  { label: "Beauty", href: "/shop?category=beauty" },
]

const SERVICE_LINKS = [
  { label: "Custom Commission", href: "/custom" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Instagram", href: "https://instagram.com" },
]

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-16 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-[11px] tracking-[0.45em] uppercase mb-5">jwld</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
              Luxury bejeweled objects. Hand-applied rhinestone and precious-metal finishes.
            </p>
          </div>

          {/* Shop */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Shop
            </p>
            <ul className="space-y-3">
              {SHOP_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs text-foreground/55 hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Services
            </p>
            <ul className="space-y-3">
              {SERVICE_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs text-foreground/55 hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Updates
            </p>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              First access to new drops.
            </p>
            <form className="flex items-end gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 min-w-0 bg-transparent border-b border-border text-xs text-foreground placeholder:text-muted-foreground/40 pb-1.5 outline-none focus:border-foreground/25 transition-colors"
              />
              <button
                type="submit"
                className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors shrink-0 pb-1.5"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-border/40">
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
            © {new Date().getFullYear()} jwld. All rights reserved.
          </p>
          <div className="flex gap-6">
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground/60 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
