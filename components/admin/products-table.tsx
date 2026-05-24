"use client"

import { useEffect, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteProductById, toggleProductActive } from "@/server/actions/admin"
import { formatCurrency, cn } from "@/lib/utils"

type ProductRow = {
  id: string
  name: string
  slug: string
  category: string
  priceCents: number
  stock: number
  active: boolean
  images: string[]
}

export function ProductsTable({ initialProducts }: { initialProducts: ProductRow[] }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({})
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Record<string, boolean>>({})
  const [pendingToggleIds, setPendingToggleIds] = useState<Record<string, boolean>>({})
  const [isRefreshing, startRefreshTransition] = useTransition()

  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  async function handleDelete(productId: string) {
    const index = products.findIndex((product) => product.id === productId)
    const product = products[index]

    if (!product) return
    if (
      !confirm(
        `Delete "${product.name}"? This cannot be undone. Products with order history will be kept.`
      )
    ) {
      return
    }

    setDeleteErrors((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
    setPendingDeleteIds((current) => ({ ...current, [productId]: true }))
    setProducts((current) => current.filter((item) => item.id !== productId))

    const result = await deleteProductById(productId)

    setPendingDeleteIds((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })

    if (result?.error) {
      setProducts((current) => {
        const next = current.slice()
        next.splice(index, 0, product)
        return next
      })
      setDeleteErrors((current) => ({ ...current, [productId]: result.error ?? "Delete failed" }))
      return
    }

    startRefreshTransition(() => {
      router.refresh()
    })
  }

  async function handleToggle(productId: string, nextActive: boolean) {
    setPendingToggleIds((current) => ({ ...current, [productId]: true }))
    setProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, active: nextActive } : product
      )
    )

    const formData = new FormData()
    formData.set("id", productId)
    formData.set("active", String(nextActive))

    try {
      await toggleProductActive(formData)
      startRefreshTransition(() => {
        router.refresh()
      })
    } catch {
      setProducts((current) =>
        current.map((product) =>
          product.id === productId ? { ...product, active: !nextActive } : product
        )
      )
    } finally {
      setPendingToggleIds((current) => {
        const next = { ...current }
        delete next[productId]
        return next
      })
    }
  }

  if (products.length === 0) {
    return (
      <div className="border border-border/30 py-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">No products yet.</p>
        <Link
          href="/admin/products/new"
          className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Create your first product →
        </Link>
      </div>
    )
  }

  return (
    <div className={cn("border border-border", isRefreshing && "opacity-90")}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              Name
            </th>
            <th className="text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hidden md:table-cell">
              Category
            </th>
            <th className="text-right px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              Price
            </th>
            <th className="text-right px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hidden sm:table-cell">
              Stock
            </th>
            <th className="text-center px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const deleteError = deleteErrors[product.id]
            const deletePending = pendingDeleteIds[product.id] ?? false
            const togglePending = pendingToggleIds[product.id] ?? false

            return (
              <tr
                key={product.id}
                className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden border border-border/50 bg-muted/20">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[9px] tracking-[0.18em] uppercase text-muted-foreground/60">
                          No Img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm">{product.name}</p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                        {product.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">
                  {formatCurrency(product.priceCents)}
                </td>
                <td className="px-4 py-3 text-right text-sm hidden sm:table-cell">
                  {product.stock}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    disabled={togglePending}
                    onClick={() => handleToggle(product.id, !product.active)}
                    className={cn(
                      "text-[9px] tracking-[0.15em] uppercase px-2 py-1 border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                      product.active
                        ? "border-green-700/40 text-green-500 hover:border-red-700/40 hover:text-red-400"
                        : "border-border text-muted-foreground hover:border-green-700/40 hover:text-green-500"
                    )}
                  >
                    {togglePending ? "Saving" : product.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={deletePending}
                      onClick={() => handleDelete(product.id)}
                      className="text-[10px] tracking-[0.15em] uppercase text-red-500/70 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletePending ? "Deleting" : "Delete"}
                    </button>
                    {deleteError && (
                      <p className="max-w-36 text-right text-[10px] normal-case tracking-normal text-red-400">
                        {deleteError}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
