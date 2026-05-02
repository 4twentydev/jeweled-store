import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { lookupOrderBySession } from "@/server/actions/order-lookup"
import { SuccessClient } from "@/components/site/success-client"

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  if (!session_id) {
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

  const initialOrder = await lookupOrderBySession(session_id)

  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="size-8 text-foreground/30 animate-spin" />
        </div>
      }
    >
      <SuccessClient sessionId={session_id} initialOrder={initialOrder} />
    </Suspense>
  )
}
