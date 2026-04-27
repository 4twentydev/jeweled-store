import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { AdminShell } from "@/components/admin/shell"
import { OrderStatusSelect } from "@/components/admin/order-status-select"
import { getAdminOrderWithItems } from "@/db/queries/admin"
import { isAdmin } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")

  const { id } = await params
  const order = await getAdminOrderWithItems(id)

  if (!order) notFound()

  return (
    <AdminShell>
      <div className="max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/orders"
            className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Orders
          </Link>
          <span className="text-border">|</span>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-mono">
            {order.id.slice(0, 8)}…
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              Customer
            </p>
            <div className="border border-border p-4 flex flex-col gap-1">
              {order.customerName && <p className="text-sm">{order.customerName}</p>}
              {order.customerEmail && (
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              )}
              {!order.customerName && !order.customerEmail && (
                <p className="text-sm text-muted-foreground italic">No customer info</p>
              )}
            </div>
          </div>

          {order.shipping && (
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
                Shipping Address
              </p>
              <div className="border border-border p-4 text-sm text-muted-foreground flex flex-col gap-0.5">
                <p>{order.shipping.line1}</p>
                {order.shipping.line2 && <p>{order.shipping.line2}</p>}
                <p>
                  {order.shipping.city}, {order.shipping.state} {order.shipping.postal_code}
                </p>
                <p>{order.shipping.country}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Status
          </p>
          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
        </div>

        <div className="mb-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Items
          </p>
          <div className="border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Product
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Qty
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Unit Price
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 text-sm">
                      {item.product?.name ?? (
                        <span className="text-muted-foreground italic">Deleted product</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatCurrency(item.priceAtPurchase)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatCurrency(item.priceAtPurchase * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end mb-8">
          <div className="border border-border p-4 min-w-52">
            <div className="flex justify-between items-center gap-8">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Total</p>
              <p className="font-mono text-lg">{formatCurrency(order.totalCents)}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
            Stripe Session
          </p>
          <p className="text-[11px] font-mono text-muted-foreground/60 break-all">
            {order.stripeCheckoutSessionId}
          </p>
        </div>
      </div>
    </AdminShell>
  )
}
