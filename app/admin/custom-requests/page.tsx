import Link from "next/link"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { getAllCustomRequests } from "@/db/queries/admin"
import { isAdmin } from "@/lib/auth"
import { cn } from "@/lib/utils"

const STATUS_COLOR: Record<string, string> = {
  pending: "text-blue-400",
  quoted: "text-yellow-400",
  paid: "text-green-400",
  prep: "text-yellow-400",
  assembly: "text-orange-400",
  shipping: "text-purple-400",
  shipped: "text-green-400",
  cancelled: "text-red-400",
}

export default async function AdminCustomRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q?.trim() || undefined
  const page = Number(resolvedSearchParams.page ?? "1") || 1
  const requests = await getAllCustomRequests({ query, page })

  return (
    <AdminShell>
      <div className="max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Custom Requests
          </p>
          <form className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search customer or description"
              className="border border-border bg-background px-3 py-2 text-sm"
            />
            <button type="submit" className="border border-border px-3 py-2 text-[10px] uppercase">
              Search
            </button>
          </form>
        </div>

        {requests.length === 0 ? (
          <div className="border border-border/30 py-16 text-center">
            <p className="text-sm text-muted-foreground">No custom requests yet.</p>
          </div>
        ) : (
          <div className="border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hidden md:table-cell">
                    Budget
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hidden sm:table-cell">
                    Date
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm">{request.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">{request.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
                        {request.budgetRange}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "text-[10px] tracking-[0.15em] uppercase",
                          STATUS_COLOR[request.status] ?? "text-muted-foreground"
                        )}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/custom-requests/${request.id}`}
                        className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Link href={page > 1 ? `/admin/custom-requests?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}` : "#"}>
            Previous
          </Link>
          <span>Page {page}</span>
          <Link href={`/admin/custom-requests?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
            Next
          </Link>
        </div>
      </div>
    </AdminShell>
  )
}
