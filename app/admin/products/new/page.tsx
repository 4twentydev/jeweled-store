import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { ProductForm } from "@/components/admin/product-form"
import { isAdmin } from "@/lib/auth"

export default async function NewProductPage() {
  if (!(await isAdmin())) redirect("/admin/login")

  return (
    <AdminShell>
      <div className="max-w-2xl">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-8">
          New Product
        </p>
        <ProductForm />
      </div>
    </AdminShell>
  )
}
