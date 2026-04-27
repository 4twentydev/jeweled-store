import { AdminShell } from "@/components/admin/shell"
import { ProductForm } from "@/components/admin/product-form"

export default function NewProductPage() {
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
