"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORY_MATERIALS: Record<string, string> = {
  "bejeweled-lighters": "Hand-applied rhinestones over a refillable metal lighter body.",
  "lighter-cases": "Rhinestone-set sleeve with a polished metal-finish base.",
  "small-cases": "Structured compact form with crystal surface detailing.",
  "lip-balms": "Decorated cosmetic shell with hand-placed crystal accents.",
  lotions: "Premium dispenser bottle with hand-applied crystal finish.",
  "custom-rhinestone-items": "Materials vary by commission and are confirmed before quoting.",
}

const ITEMS = [
  {
    title: "Materials",
    content: (category: string) =>
      CATEGORY_MATERIALS[category] ?? "Hand-applied crystal detailing over a finished base object.",
  },
  {
    title: "Dimensions",
    content: () =>
      "Sizing varies by base item. Exact dimensions can be confirmed before shipment or during a custom quote.",
  },
  {
    title: "Care Instructions",
    content: () =>
      "Handle gently, keep dry, and clean with a soft cloth. Avoid soaking, harsh solvents, and abrasive storage.",
  },
]

export function ProductDetailAccordions({ category }: { category: string }) {
  const [open, setOpen] = useState("Materials")

  return (
    <div className="border-y border-border/40 divide-y divide-border/40">
      {ITEMS.map((item) => {
        const isOpen = open === item.title
        return (
          <div key={item.title}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? "" : item.title)}
              className="w-full py-4 flex items-center justify-between text-left"
              aria-expanded={isOpen}
            >
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                {item.title}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <p className="pb-5 text-sm text-foreground/65 leading-relaxed">
                {item.content(category)}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
