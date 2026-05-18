import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { DeleteProductButton } from "@/components/admin/delete-product-button"
import { getAllProducts } from "@/db/queries/admin"
import { toggleProductActive } from "@/server/actions/admin"
import { isAdmin } from "@/lib/auth"
import { formatCurrency, cn } from "@/lib/utils"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q?.trim() || undefined
  const page = Number(resolvedSearchParams.page ?? "1") || 1
  const products = await getAllProducts({ query, page })

  return (
    <AdminShell>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Products
            </p>
            <div className="flex gap-2">
              <form className="flex gap-2">
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search name or slug"
                  className="border border-border bg-background px-3 py-2 text-sm"
                />
                <button type="submit" className="border border-border px-3 py-2 text-[10px] uppercase">
                  Search
                </button>
              </form>
              <Link
                href="/admin/products/new"
                className="text-[10px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-4 py-2.5 hover:bg-primary/90 transition-colors"
              >
                + New Product
              </Link>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="border border-border/30 py-16 text-center">
            <p className="text-sm text-muted-foreground mb-4">No products yet.</p>
            <Link
              href="/admin/products/new"
              className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Create your first product →
            </Link>
          </div>
        ) : (
          <div className="border border-border">
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
                {products.map((product) => (
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
                      <form action={toggleProductActive}>
                        <input type="hidden" name="id" value={product.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={(!product.active).toString()}
                        />
                        <button
                          type="submit"
                          className={cn(
                            "text-[9px] tracking-[0.15em] uppercase px-2 py-1 border transition-colors cursor-pointer",
                            product.active
                              ? "border-green-700/40 text-green-500 hover:border-red-700/40 hover:text-red-400"
                              : "border-border text-muted-foreground hover:border-green-700/40 hover:text-green-500"
                          )}
                        >
                          {product.active ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Link href={page > 1 ? `/admin/products?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}` : "#"}>
            Previous
          </Link>
          <span>Page {page}</span>
          <Link href={`/admin/products?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
            Next
          </Link>
        </div>
      </div>
    </AdminShell>
  )
}
