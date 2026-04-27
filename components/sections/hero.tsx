"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col overflow-hidden">
      {/* Atmospheric background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 65% 35%, rgba(255,255,255,0.022) 0%, transparent 60%), #050505",
        }}
      />

      {/* Giant typographic watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none"
        aria-hidden
      >
        <span
          className="font-light uppercase text-foreground leading-none"
          style={{
            fontSize: "clamp(130px, 26vw, 420px)",
            letterSpacing: "0.22em",
            opacity: 0.022,
          }}
        >
          jwld
        </span>
      </div>

      {/* Content — bottom-left anchored */}
      <div className="relative z-10 mt-auto max-w-[1400px] mx-auto w-full px-6 lg:px-12 pb-24 md:pb-36">
        <div className="max-w-[560px]">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-7"
          >
            Hand-Applied · Ruthlessly Refined
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="font-light tracking-tight text-foreground leading-[1.04] mb-12"
            style={{ fontSize: "clamp(2.6rem, 6.5vw, 5.5rem)" }}
          >
            Objects That<br className="hidden sm:block" /> Catch the Light.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.32 }}
          >
            <Link
              href="/products"
              className="group inline-flex items-center gap-3 text-[11px] tracking-[0.28em] uppercase text-foreground"
            >
              <span className="relative">
                Shop the Collection
                <span
                  className="absolute bottom-0 left-0 w-full h-px opacity-90 group-hover:opacity-50 transition-opacity duration-300"
                  style={{ backgroundColor: "var(--jwld-accent)" }}
                />
              </span>
              <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
