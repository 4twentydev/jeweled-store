"use client"

import { useActionState } from "react"
import { deleteProduct } from "@/server/actions/admin"

type Props = {
  productId: string
  productName: string
}

export function DeleteProductButton({ productId, productName }: Props) {
  const [state, action, pending] = useActionState(deleteProduct, undefined)

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !confirm(
            `Delete "${productName}"? This cannot be undone. Products with order history will be kept.`
          )
        ) {
          event.preventDefault()
        }
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        disabled={pending}
        className="text-[10px] tracking-[0.15em] uppercase text-red-500/70 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting" : "Delete"}
      </button>
      {state?.error && (
        <p className="max-w-36 text-right text-[10px] normal-case tracking-normal text-red-400">
          {state.error}
        </p>
      )}
    </form>
  )
}
