"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { isAdmin, clearAdminCookie } from "@/lib/auth"
import { getDb } from "@/db"
import { products, orders, customRequests } from "@/db/schema"
import { eq } from "drizzle-orm"
import {
  customRequestAdminSchema,
  productFormSchema,
  type CustomRequestAdminInput,
  type ProductFormInput,
} from "@/lib/validators"
import type { CustomRequestStatus, OrderStatus } from "@/db/schema"

type ActionResult = { error: string } | undefined

async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login")
}

export async function createProduct(data: ProductFormInput): Promise<ActionResult> {
  await requireAdmin()

  const parsed = productFormSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid input" }

  const { name, slug, description, category, priceInDollars, stock, featured, active, images } =
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
      images,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "A product with this slug already exists" }
    }
    return { error: "Failed to create product" }
  }

  revalidatePath("/admin/products")
  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/products")
  revalidatePath(`/product/${slug}`)
  redirect("/admin/products")
}

export async function updateProduct(id: string, data: ProductFormInput): Promise<ActionResult> {
  await requireAdmin()

  const parsed = productFormSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid input" }

  const { name, slug, description, category, priceInDollars, stock, featured, active, images } =
    parsed.data

  try {
    const [existing] = await getDb()
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, id))

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
        images,
      })
      .where(eq(products.id, id))

    if (existing?.slug) revalidatePath(`/product/${existing.slug}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "A product with this slug already exists" }
    }
    return { error: "Failed to update product" }
  }

  revalidatePath("/admin/products")
  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/products")
  revalidatePath(`/product/${slug}`)
  redirect("/admin/products")
}

export async function toggleProductActive(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get("id") as string
  const active = formData.get("active") === "true"
  if (!id) return
  const [product] = await getDb()
    .update(products)
    .set({ active })
    .where(eq(products.id, id))
    .returning({ slug: products.slug })
  revalidatePath("/admin/products")
  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/products")
  if (product?.slug) revalidatePath(`/product/${product.slug}`)
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult> {
  await requireAdmin()

  const valid: OrderStatus[] = ["new", "prep", "assembly", "shipping", "shipped", "cancelled"]
  if (!valid.includes(status)) return { error: "Invalid status" }

  await getDb().update(orders).set({ status }).where(eq(orders.id, id))
  revalidatePath("/admin")
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
}

export async function updateCustomRequest(
  id: string,
  data: CustomRequestAdminInput
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = customRequestAdminSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid input" }

  const { status, quotedPriceInDollars, stripePaymentLinkId } = parsed.data

  await getDb()
    .update(customRequests)
    .set({
      status: status as CustomRequestStatus,
      quotedPrice:
        typeof quotedPriceInDollars === "number"
          ? Math.round(quotedPriceInDollars * 100)
          : null,
      stripePaymentLinkId: stripePaymentLinkId || null,
    })
    .where(eq(customRequests.id, id))

  revalidatePath("/admin")
  revalidatePath("/admin/custom-requests")
  revalidatePath(`/admin/custom-requests/${id}`)
}

export async function adminLogout(): Promise<void> {
  await clearAdminCookie()
  redirect("/admin/login")
}
