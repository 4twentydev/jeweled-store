"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"
import { CheckCircle, Loader2 } from "lucide-react"
import type { Order } from "@/types"

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const sessionId = searchParams.get("session_id")
  const [order, setOrder] = useState<Order | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  useEffect(() => {
    if (!sessionId) return

    startTimeRef.current = Date.now()
    const MAX_WAIT_MS = 30_000
    const POLL_MS = 2_000

    async function poll() {
      if (Date.now() - startTimeRef.current > MAX_WAIT_MS) {
        setTimedOut(true)
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }
      try {
        const res = await fetch(`/api/orders/session/${sessionId}`)
        if (!res.ok) return
        const data = (await res.json()) as { order: Order | null }
        if (data.order) {
          setOrder(data.order)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      } catch {
        // keep polling on network errors
      }
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">No session found.</p>
        <Link
          href="/"
          className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Shop
        </Link>
      </div>
    )
  }

  if (order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-8 px-6 text-center">
        <CheckCircle className="size-12 text-foreground/60" strokeWidth={1.5} />
        <div className="space-y-2">
          <h1 className="text-sm tracking-wide">Order Confirmed</h1>
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            Thank you{order.customerName ? `, ${order.customerName}` : ""}
          </p>
        </div>
        {order.customerEmail && (
          <p className="text-xs text-muted-foreground">
            A confirmation will be sent to {order.customerEmail}
          </p>
        )}
        <div className="border border-border/40 p-6 text-left w-full max-w-xs space-y-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order total</span>
            <span className="font-mono">{formatPrice(order.totalCents)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="text-[10px] tracking-[0.15em] uppercase">{order.status}</span>
          </div>
        </div>
        <Link
          href="/products"
          className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  if (timedOut) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <CheckCircle className="size-12 text-foreground/40" strokeWidth={1.5} />
        <div className="space-y-2">
          <h1 className="text-sm tracking-wide">Payment Received</h1>
          <p className="text-xs text-muted-foreground max-w-sm">
            Your payment was successful. We&apos;re finalizing your order and you&apos;ll receive a
            confirmation email shortly.
          </p>
        </div>
        <Link
          href="/products"
          className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <Loader2 className="size-8 text-foreground/30 animate-spin" />
      <div className="space-y-2">
        <h1 className="text-sm tracking-wide">Confirming Your Order</h1>
        <p className="text-xs text-muted-foreground">This will only take a moment…</p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="size-8 text-foreground/30 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
