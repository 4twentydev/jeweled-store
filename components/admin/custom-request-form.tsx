"use client"

import { useState, useTransition } from "react"
import { updateCustomRequest } from "@/server/actions/admin"
import type { CustomRequestStatus } from "@/db/schema"

type EditableCustomRequestStatus = Exclude<CustomRequestStatus, "paid">

const STATUSES: { value: EditableCustomRequestStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "quoted", label: "Quoted" },
  { value: "prep", label: "Prep" },
  { value: "assembly", label: "Assembly" },
  { value: "shipping", label: "Shipping" },
  { value: "shipped", label: "Shipped" },
  { value: "cancelled", label: "Cancelled" },
]

const INPUT =
  "border border-border bg-background text-foreground px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
const LABEL = "text-[10px] tracking-[0.2em] uppercase text-muted-foreground"

export function CustomRequestForm({
  requestId,
  currentStatus,
  quotedPrice,
  stripePaymentLinkId,
}: {
  requestId: string
  currentStatus: CustomRequestStatus
  quotedPrice: number | null
  stripePaymentLinkId: string | null
}) {
  const [status, setStatus] = useState<EditableCustomRequestStatus>(
    currentStatus === "paid" ? "prep" : currentStatus
  )
  const [price, setPrice] = useState(quotedPrice ? String(quotedPrice / 100) : "")
  const [paymentLink, setPaymentLink] = useState(stripePaymentLinkId ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateCustomRequest(requestId, {
        status,
        quotedPriceInDollars: price ? Number(price) : undefined,
        stripePaymentLinkId: paymentLink.trim() || undefined,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-status" className={LABEL}>
            Status
          </label>
          <select
            id="custom-status"
            value={status}
              onChange={(event) => setStatus(event.target.value as EditableCustomRequestStatus)}
            className={INPUT}
          >
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-quote" className={LABEL}>
            Quote USD
          </label>
          <input
            id="custom-quote"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            type="number"
            min="0"
            step="0.01"
            className={INPUT}
            placeholder="250.00"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-payment-link" className={LABEL}>
            Stripe Link
          </label>
          <input
            id="custom-payment-link"
            value={paymentLink}
            onChange={(event) => setPaymentLink(event.target.value)}
            className={INPUT}
            placeholder="plink_... or https://..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {isPending ? "Saving..." : "Save Request"}
        </button>
        {saved && <p className="text-[11px] text-green-500">Saved</p>}
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>
    </form>
  )
}
