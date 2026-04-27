import Link from "next/link"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { getAdminStats } from "@/db/queries/admin"
import { isAdmin } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login")

  const stats = await getAdminStats()

  const cards = [
    { label: "Total Products", value: stats.totalProducts },
    { label: "Active Products", value: stats.activeProducts },
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Revenue", value: formatCurrency(stats.totalRevenueCents) },
  ]

  return (
    <AdminShell>
      <div className="max-w-4xl">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-8">
          Overview
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 border border-border mb-12">
          {cards.map((card, i) => (
            <div
              key={card.label}
              className={`p-6 bg-card ${i < cards.length - 1 ? "border-r border-border" : ""}`}
            >
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
                {card.label}
              </p>
              <p className="text-2xl font-light">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link
            href="/admin/products"
            className="text-[10px] tracking-[0.2em] uppercase border border-border px-4 py-2.5 hover:border-foreground/40 transition-colors"
          >
            Manage Products →
          </Link>
          <Link
            href="/admin/orders"
            className="text-[10px] tracking-[0.2em] uppercase border border-border px-4 py-2.5 hover:border-foreground/40 transition-colors"
          >
            View Orders →
          </Link>
        </div>
      </div>
    </AdminShell>
  )
}
