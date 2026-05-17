"use client"

import { useState } from "react"
import { FadeUp } from "@/components/fade-up"
import { MAX_CUSTOM_REFERENCE_IMAGES } from "@/lib/validators"

const BUDGET_OPTIONS = [
  { value: "25", label: "$25" },
  { value: "35", label: "$35" },
  { value: "50", label: "$50" },
] satisfies { value: string; label: string }[]

export default function CustomPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referenceImages, setReferenceImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleReferenceUpload(files: FileList | null) {
    const selected = Array.from(files ?? []).slice(0, MAX_CUSTOM_REFERENCE_IMAGES - referenceImages.length)
    if (selected.length === 0) return

    setError(null)
    setUploading(true)

    try {
      const uploaded: string[] = []
      for (const file of selected) {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch("/api/custom-request-upload", {
          method: "POST",
          body: form,
        })
        const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
        if (!res.ok || !body.url) {
          throw new Error(body.error ?? "Image upload failed")
        }
        uploaded.push(body.url)
      }

      setReferenceImages((current) =>
        [...current, ...uploaded].slice(0, MAX_CUSTOM_REFERENCE_IMAGES)
      )
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed")
    } finally {
      setUploading(false)
    }
  }

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
      referenceImages,
    }

    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: unknown }
        setError(typeof json.error === "string" ? json.error : "Please check the form and try again.")
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
                  <option value="">Select a budget</option>
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
                  Reference Images
                </p>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => void handleReferenceUpload(event.target.files)}
                    disabled={uploading || referenceImages.length >= MAX_CUSTOM_REFERENCE_IMAGES}
                    className="w-full bg-transparent border border-border/50 px-4 py-3 text-sm text-foreground file:mr-4 file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-[0.2em] file:text-background focus:outline-none focus:border-foreground/50 transition-colors"
                  />
                  {referenceImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {referenceImages.map((url) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() =>
                            setReferenceImages((current) => current.filter((item) => item !== url))
                          }
                          className="border border-border/50 px-3 py-2 text-left text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Remove uploaded image
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground/70">
                    Upload up to {MAX_CUSTOM_REFERENCE_IMAGES} images. We store them securely for
                    the request instead of accepting arbitrary links.
                  </p>
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full py-3.5 text-[11px] tracking-[0.3em] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? "Sending…" : uploading ? "Uploading…" : "Submit Commission Request"}
              </button>
            </form>
          </FadeUp>
        </div>
      </div>
    </div>
  )
}
