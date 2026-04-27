"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { isAdmin, clearAdminCookie } from "@/lib/auth"
import { getDb } from "@/db"
import { products, orders } from "@/db/schema"
import { eq } from "drizzle-orm"
import { productFormSchema, type ProductFormInput } from "@/lib/validators"
import type { OrderStatus } from "@/db/schema"

type ActionResult = { error: string } | undefined

async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login")
}

export async function createProduct(data: ProductFormInput): Promise<ActionResult> {
  await requireAdmin()

  const parsed = productFormSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid input" }

  const { name, slug, description, category, priceInDollars, stock, featured, active } =
    parsed.data

  try {
    await getDb().insert(products).values({
      name,
      slug,
      description,
      category,
      priceCents: Math.round(priceInDollars * 100),
      stock,
      featured,
      active,
      images: [],
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "A product with this slug already exists" }
    }
    return { error: "Failed to create product" }
  }

  revalidatePath("/admin/products")
  revalidatePath("/products")
  redirect("/admin/products")
}

export async function updateProduct(id: string, data: ProductFormInput): Promise<ActionResult> {
  await requireAdmin()

  const parsed = productFormSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid input" }

  const { name, slug, description, category, priceInDollars, stock, featured, active } =
    parsed.data

  try {
    await getDb()
      .update(products)
      .set({
        name,
        slug,
        description,
        category,
        priceCents: Math.round(priceInDollars * 100),
        stock,
        featured,
        active,
      })
      .where(eq(products.id, id))
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "A product with this slug already exists" }
    }
    return { error: "Failed to update product" }
  }

  revalidatePath("/admin/products")
  revalidatePath("/products")
  redirect("/admin/products")
}

export async function toggleProductActive(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get("id") as string
  const active = formData.get("active") === "true"
  if (!id) return
  await getDb().update(products).set({ active }).where(eq(products.id, id))
  revalidatePath("/admin/products")
  revalidatePath("/products")
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult> {
  await requireAdmin()

  const valid: OrderStatus[] = ["new", "prep", "assembly", "shipping", "shipped", "cancelled"]
  if (!valid.includes(status)) return { error: "Invalid status" }

  await getDb().update(orders).set({ status }).where(eq(orders.id, id))
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
}

export async function adminLogout(): Promise<void> {
  await clearAdminCookie()
  redirect("/admin/login")
}
