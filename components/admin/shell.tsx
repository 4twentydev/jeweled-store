import Link from "next/link"
import { AdminNav } from "./nav"
import { adminLogout } from "@/server/actions/admin"

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 border-r border-border flex flex-col">
        <div className="p-5 border-b border-border flex flex-col gap-3">
          <Link
            href="/"
            className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Store
          </Link>
          <p className="text-[11px] tracking-[0.35em] uppercase">Admin</p>
        </div>
        <AdminNav />
        <div className="p-4 border-t border-border mt-auto">
          <form action={adminLogout}>
            <button
              type="submit"
              className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
