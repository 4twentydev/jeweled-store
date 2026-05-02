import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { AdminShell } from "@/components/admin/shell"
import { CustomRequestForm } from "@/components/admin/custom-request-form"
import { getCustomRequestById } from "@/db/queries/admin"
import { isAdmin } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"

const BUDGET_LABEL: Record<string, string> = {
  "under-200": "Under $200",
  "200-500": "$200-$500",
  "500-1000": "$500-$1,000",
  "1000-2500": "$1,000-$2,500",
  "2500-plus": "$2,500+",
}

export default async function AdminCustomRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")

  const { id } = await params
  const request = await getCustomRequestById(id)

  if (!request) notFound()

  return (
    <AdminShell>
      <div className="max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/custom-requests"
            className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Custom
          </Link>
          <span className="text-border">|</span>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-mono">
            {request.id.slice(0, 8)}...
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              Customer
            </p>
            <div className="border border-border p-4 flex flex-col gap-1">
              <p className="text-sm">{request.customerName}</p>
              <a
                href={`mailto:${request.customerEmail}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {request.customerEmail}
              </a>
            </div>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              Request
            </p>
            <div className="border border-border p-4 flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">
                {BUDGET_LABEL[request.budgetRange] ?? request.budgetRange}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.quotedPrice ? formatCurrency(request.quotedPrice) : "No quote yet"}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Workshop Status
          </p>
          <CustomRequestForm
            requestId={request.id}
            currentStatus={request.status}
            quotedPrice={request.quotedPrice}
            stripePaymentLinkId={request.stripePaymentLinkId}
          />
        </div>

        <div className="mb-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Description
          </p>
          <div className="border border-border p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {request.itemDescription}
            </p>
          </div>
        </div>

        {request.referenceImages.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              References
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {request.referenceImages.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-border p-3 text-[11px] text-muted-foreground hover:text-foreground break-all transition-colors"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
