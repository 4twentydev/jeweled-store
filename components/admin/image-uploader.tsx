"use client"

import { useController, type Control } from "react-hook-form"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import type { ProductFormInput } from "@/lib/validators"

const LABEL = "text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
const ERROR = "text-[11px] text-destructive mt-1"
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const MAX_COMPRESSED_DIMENSION = 2400
const WEBP_QUALITIES = [0.86, 0.78, 0.7, 0.62]

type UploadEntry = { id: string; status: "uploading" | "error"; message?: string }

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality)
  })
}

async function prepareUploadFile(file: File) {
  if (file.size <= MAX_UPLOAD_BYTES) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error(`Image is ${formatFileSize(file.size)}. Upload a file under 10 MB.`)
  }

  try {
    const scale = Math.min(
      1,
      MAX_COMPRESSED_DIMENSION / Math.max(bitmap.width, bitmap.height)
    )
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not prepare image for upload")
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    for (const quality of WEBP_QUALITIES) {
      const blob = await canvasToBlob(canvas, quality)
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        const basename = file.name.replace(/\.[^.]+$/, "") || "product-image"
        return new File([blob], `${basename}.webp`, {
          type: "image/webp",
          lastModified: Date.now(),
        })
      }
    }
  } finally {
    bitmap.close()
  }

  throw new Error(`Image is ${formatFileSize(file.size)}. Upload a file under 10 MB.`)
}

export function ImageUploader({ control }: { control: Control<ProductFormInput> }) {
  const { field, fieldState } = useController({ name: "images", control })
  const [entries, setEntries] = useState<UploadEntry[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  // Keep a ref so async callbacks always read the latest field value, not the
  // render-cycle snapshot captured when handleFiles was created.
  const fieldRef = useRef(field)

  useEffect(() => {
    fieldRef.current = field
  }, [field])

  const images = (field.value as string[]) ?? []

  async function handleFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? [])
    if (!selectedFiles.length) return
    if (inputRef.current) inputRef.current.value = ""

    for (const file of selectedFiles) {
      const id = crypto.randomUUID()
      setEntries((prev) => [...prev, { id, status: "uploading" }])

      try {
        const uploadFile = await prepareUploadFile(file)
        const form = new FormData()
        form.append("file", uploadFile)

        const res = await fetch("/api/admin/upload", { method: "POST", body: form })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          console.error("[upload]", res.status, body)
          throw new Error(
            typeof body.error === "string" ? body.error : "Upload failed"
          )
        }
        const { url } = body as { url?: string }
        if (!url) throw new Error("Upload response did not include an image URL")
        const current = (fieldRef.current.value as string[]) ?? []
        fieldRef.current.onChange([...current, url])
        setEntries((prev) => prev.filter((e) => e.id !== id))
      } catch (err) {
        console.error("[upload] failed:", err)
        const message = err instanceof Error ? err.message : "Upload failed"
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "error", message } : e))
        )
      }
    }
  }

  return (
    <div className="col-span-2 flex flex-col gap-1.5">
      <label className={LABEL}>Images</label>

      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div key={url} className="relative w-24 h-24 border border-border group overflow-hidden">
            <Image src={url} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => field.onChange(images.filter((u) => u !== url))}
              className="absolute top-0 right-0 w-5 h-5 bg-black/70 text-white text-xs hidden group-hover:flex items-center justify-center cursor-pointer"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}

        {entries.map(({ id, status, message }) => (
          <div
            key={id}
            className="w-24 h-24 border flex items-center justify-center relative text-center px-1"
            style={{ borderColor: status === "error" ? "var(--destructive)" : undefined }}
            title={message}
          >
            {status === "uploading" ? (
              <span className="text-[10px] text-muted-foreground">Uploading…</span>
            ) : (
              <>
                <span className="flex max-h-16 flex-col items-center justify-center overflow-hidden">
                  <span className="text-[11px] text-destructive font-medium leading-tight">
                    Upload failed
                  </span>
                  {message && (
                    <span className="mt-1 text-[9px] text-destructive/80 leading-tight break-words">
                      {message}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setEntries((prev) => prev.filter((e) => e.id !== id))}
                  className="absolute top-0 right-0 w-5 h-5 bg-destructive text-white text-xs flex items-center justify-center cursor-pointer"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-24 h-24 border border-dashed border-border hover:border-foreground text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center cursor-pointer text-2xl leading-none"
          aria-label="Add image"
        >
          +
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {fieldState.error && <span className={ERROR}>{fieldState.error.message}</span>}
    </div>
  )
}
