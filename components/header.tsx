import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-[11px] tracking-[0.18em] uppercase text-foreground/55 hover:text-foreground transition-colors duration-200"
    >
      {children}
    </Link>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-sm">
      <nav className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between gap-6">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-[11px] tracking-[0.45em] uppercase font-medium text-foreground hover:text-foreground/70 transition-colors shrink-0"
        >
          jwld
        </Link>

        {/* Desktop nav — centre */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/shop">Shop</NavLink>
          <NavLink href="/custom">Custom</NavLink>
          <NavLink href="/about">About</NavLink>
        </div>

        {/* Right — cart + mobile toggle */}
        <div className="flex items-center gap-5">
          <Link
            href="/cart"
            aria-label="Cart"
            className="flex items-center gap-1.5 text-foreground/60 hover:text-foreground transition-colors"
          >
            <ShoppingBag className="size-[17px]" />
            <span
              className="text-[10px] font-mono tabular-nums leading-none"
              style={{ color: "var(--jwld-accent)" }}
            >
              0
            </span>
          </Link>

          <MobileNav />
        </div>
      </nav>
    </header>
  )
}
