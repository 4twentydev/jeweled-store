"use client"

import { useState } from "react"
import Image from "next/image"

const FALLBACK_BG =
  "radial-gradient(ellipse 55% 65% at 50% 35%, rgba(247,244,239,0.05) 0%, transparent 70%), #0e0e0e"

export function ProductGallery({
  images,
  name,
  background = FALLBACK_BG,
}: {
  images: string[]
  name: string
  background?: string
}) {
  const [active, setActive] = useState(0)
  const activeImage = images[active]

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden" style={{ background }}>
        {activeImage && (
          <Image
            src={activeImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
            unoptimized
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              className="relative aspect-square overflow-hidden border border-border/40 data-[active=true]:border-foreground"
              data-active={active === index}
              aria-label={`View ${name} image ${index + 1}`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
