import Link from "next/link"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { getAllOrders } from "@/db/queries/admin"
import { isAdmin } from "@/lib/auth"
import { formatCurrency, cn } from "@/lib/utils"

const STATUS_COLOR: Record<string, string> = {
  new: "text-blue-400",
  prep: "text-yellow-400",
  assembly: "text-orange-400",
  shipping: "text-purple-400",
  shipped: "text-green-400",
  cancelled: "text-red-400",
}

export default async function AdminOrdersPage() {
  if (!(await isAdmin())) redirect("/admin/login")

  const orders = await getAllOrders()

  return (
    <AdminShell>
      <div className="max-w-5xl">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-8">
          Orders ({orders.length})
        </p>

        {orders.length === 0 ? (
          <div className="border border-border/30 py-16 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hidden md:table-cell">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hidden sm:table-cell">
                    Date
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        {order.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div>
                        {order.customerName && (
                          <p className="text-sm">{order.customerName}</p>
                        )}
                        {order.customerEmail && (
                          <p className="text-[11px] text-muted-foreground">
                            {order.customerEmail}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
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
                          STATUS_COLOR[order.status] ?? "text-muted-foreground"
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatCurrency(order.totalCents)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
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
      </div>
    </AdminShell>
  )
}
