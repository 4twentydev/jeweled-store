import { notFound } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { ProductForm } from "@/components/admin/product-form"
import { getProductById } from "@/db/queries/admin"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) notFound()

  return (
    <AdminShell>
      <div className="max-w-2xl">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
          Edit Product
        </p>
        <p className="text-sm text-muted-foreground mb-8">{product.name}</p>
        <ProductForm product={product} />
      </div>
    </AdminShell>
  )
}
