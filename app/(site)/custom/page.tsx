"use client"

import { useState } from "react"
import { FadeUp } from "@/components/fade-up"

const BUDGET_OPTIONS = ["Under $200", "$200–$500", "$500–$1,000", "$1,000+"]

export default function CustomPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const data = {
      customerName: (form.elements.namedItem("name") as HTMLInputElement).value,
      customerEmail: (form.elements.namedItem("email") as HTMLInputElement).value,
      itemDescription: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
      budgetRange: (form.elements.namedItem("budget") as HTMLSelectElement).value,
    }

    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setError(json.error ?? "Something went wrong. Please try again.")
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError("Unable to connect. Please try again.")
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground">Received</p>
        <h1 className="text-sm tracking-wide text-foreground">We&apos;ll be in touch within 48 hours.</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 lg:px-12 py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto">
        <div className="max-w-[520px]">
          <FadeUp>
            <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-10">
              Bespoke Commission
            </p>

            <h1
              className="font-light tracking-tight text-foreground leading-[1.06] mb-6"
              style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}
            >
              Something Entirely Yours.
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed mb-12">
              Bring your own object or describe your vision. We apply every stone by hand and
              respond with a quote within 48 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label
                  htmlFor="name"
                  className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="w-full bg-transparent border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full bg-transparent border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
                >
                  Describe your object or vision
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  className="w-full bg-transparent border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="budget"
                  className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
                >
                  Budget range
                </label>
                <select
                  id="budget"
                  name="budget"
                  required
                  className="w-full bg-background border border-border/50 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground/50 transition-colors"
                >
                  <option value="">Select a range</option>
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-[11px] tracking-[0.3em] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? "Sending…" : "Submit Commission Request"}
              </button>
            </form>
          </FadeUp>
        </div>
      </div>
    </div>
  )
}
