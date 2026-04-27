"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"

const NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/custom", label: "Custom" },
  { href: "/about", label: "About" },
  { href: "/cart", label: "Cart" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden text-foreground/60 hover:text-foreground transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="size-[18px]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-border/50">
              <span className="text-xs tracking-[0.4em] uppercase">jwld</span>
              <button
                onClick={() => setOpen(false)}
                className="text-foreground/60 hover:text-foreground transition-colors"
                aria-label="Close navigation"
              >
                <X className="size-[18px]" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 flex flex-col justify-center px-10 gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: i * 0.07 + 0.1,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-[2.5rem] font-light tracking-tight text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Footer tag */}
            <div className="px-10 pb-10">
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                Ruthlessly Refined
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
