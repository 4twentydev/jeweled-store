import Link from "next/link"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { ProductsTable } from "@/components/admin/products-table"
import { getAllProducts } from "@/db/queries/admin"
import { isAdmin } from "@/lib/auth"

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

        <ProductsTable initialProducts={products} />

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
