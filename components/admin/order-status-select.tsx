"use client"

import { useState, useTransition } from "react"
import { updateOrderStatus } from "@/server/actions/admin"
import type { OrderStatus } from "@/db/schema"

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "prep", label: "Prep" },
  { value: "assembly", label: "Assembly" },
  { value: "shipping", label: "Shipping" },
  { value: "shipped", label: "Shipped" },
  { value: "cancelled", label: "Cancelled" },
]

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleChange = (next: OrderStatus) => {
    const prev = status
    setStatus(next)
    setError(null)
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next)
      if (result?.error) {
        setStatus(prev)
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        disabled={isPending}
        className="border border-border bg-background text-foreground px-3 py-2 text-sm w-48 outline-none focus:ring-1 focus:ring-ring cursor-pointer disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
      {isPending && (
        <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
          Saving…
        </span>
      )}
    </div>
  )
}
