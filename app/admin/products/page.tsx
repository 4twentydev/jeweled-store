import Link from "next/link"
import { AdminShell } from "@/components/admin/shell"
import { getAllProducts } from "@/db/queries/admin"
import { toggleProductActive } from "@/server/actions/admin"
import { formatCurrency, cn } from "@/lib/utils"

export default async function AdminProductsPage() {
  const products = await getAllProducts()

  return (
    <AdminShell>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Products ({products.length})
          </p>
          <Link
            href="/admin/products/new"
            className="text-[10px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-4 py-2.5 hover:bg-primary/90 transition-colors"
          >
            + New Product
          </Link>
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
                      <p className="text-sm">{product.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {product.slug}
                      </p>
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
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
