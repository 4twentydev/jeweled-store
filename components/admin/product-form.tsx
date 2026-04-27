"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import Link from "next/link"
import { productFormSchema, type ProductFormInput, PRODUCT_CATEGORIES } from "@/lib/validators"
import { createProduct, updateProduct } from "@/server/actions/admin"
import { cn } from "@/lib/utils"

type ProductData = {
  id: string
  name: string
  slug: string
  description: string
  category: string
  priceCents: number
  stock: number
  featured: boolean
  active: boolean
}

const INPUT =
  "border border-border bg-background text-foreground px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
const LABEL = "text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
const ERROR = "text-[11px] text-destructive mt-1"

export function ProductForm({ product }: { product?: ProductData }) {
  const isEditing = !!product
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category,
          priceInDollars: product.priceCents / 100,
          stock: product.stock,
          featured: product.featured,
          active: product.active,
        }
      : {
          name: "",
          slug: "",
          description: "",
          category: "",
          priceInDollars: 0,
          stock: 0,
          featured: false,
          active: true,
        },
  })

  const nameValue = watch("name")

  const handleNameBlur = () => {
    if (!isEditing) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      setValue("slug", slug, { shouldValidate: false })
    }
  }

  const onSubmit = handleSubmit((data) => {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateProduct(product.id, data)
        : await createProduct(data)
      if (result?.error) setError(result.error)
    })
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-destructive border border-destructive/30 px-4 py-3">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className={LABEL}>Name</label>
          <input
            {...register("name")}
            onBlur={handleNameBlur}
            className={INPUT}
            placeholder="Rhinestone Zippo"
          />
          {errors.name && <span className={ERROR}>{errors.name.message}</span>}
        </div>

        <div className="col-span-2 flex flex-col gap-1.5">
          <label className={LABEL}>Slug</label>
          <input {...register("slug")} className={INPUT} placeholder="rhinestone-zippo" />
          {errors.slug && <span className={ERROR}>{errors.slug.message}</span>}
        </div>

        <div className="col-span-2 flex flex-col gap-1.5">
          <label className={LABEL}>Description</label>
          <textarea
            {...register("description")}
            className={cn(INPUT, "min-h-[120px] resize-y")}
            placeholder="Hand-applied rhinestone finish…"
          />
          {errors.description && <span className={ERROR}>{errors.description.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Category</label>
          <select {...register("category")} className={cn(INPUT, "cursor-pointer")}>
            <option value="">Select…</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && <span className={ERROR}>{errors.category.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Price (USD)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register("priceInDollars", { valueAsNumber: true })}
            className={INPUT}
            placeholder="29.99"
          />
          {errors.priceInDollars && <span className={ERROR}>{errors.priceInDollars.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Stock</label>
          <input
            type="number"
            step="1"
            min="0"
            {...register("stock", { valueAsNumber: true })}
            className={INPUT}
            placeholder="10"
          />
          {errors.stock && <span className={ERROR}>{errors.stock.message}</span>}
        </div>

        <div className="col-span-2 flex flex-col gap-3 pt-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("featured")}
              className="w-4 h-4 border border-border bg-background cursor-pointer"
            />
            <span className={LABEL}>Featured product</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("active")}
              className="w-4 h-4 border border-border bg-background cursor-pointer"
            />
            <span className={LABEL}>Active (visible in store)</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-6 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground px-6 py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors cursor-pointer"
        >
          {isPending ? "Saving…" : isEditing ? "Update Product" : "Create Product"}
        </button>
        <Link
          href="/admin/products"
          className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
