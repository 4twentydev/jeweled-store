"use client"

import { useActionState } from "react"
import { adminLogin } from "@/server/actions/auth"

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form action={action} className="flex flex-col gap-4 w-full max-w-xs px-4">
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          className="border border-border bg-background text-foreground px-3 py-2 text-sm rounded-none outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50 cursor-pointer"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  )
}
