import { z } from "zod"

export const MAX_CHECKOUT_LINE_ITEMS = 25
export const MAX_CHECKOUT_QUANTITY = 10
export const MAX_CART_STORAGE_ITEMS = 50
export const MAX_CUSTOM_REFERENCE_IMAGES = 5

export const PRODUCT_CATEGORY_VALUES = [
  "bejeweled-lighters",
  "lighter-cases",
  "small-cases",
  "lip-balms",
  "lotions",
  "custom-rhinestone-items",
] as const

export const productCategorySchema = z.enum(PRODUCT_CATEGORY_VALUES)

export const PRODUCT_CATEGORIES = [
  { value: "bejeweled-lighters", label: "Bejeweled Lighters" },
  { value: "lighter-cases", label: "Lighter Cases" },
  { value: "small-cases", label: "Small Containers" },
  { value: "lip-balms", label: "Lip Balms" },
  { value: "lotions", label: "Lotions" },
  { value: "custom-rhinestone-items", label: "Custom Rhinestone Items" },
] as const

const blobImageUrlSchema = z.url().refine(
  (value) => {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com")
    )
  },
  "Images must be uploaded through the admin image uploader"
)

const productImageUrlSchema = blobImageUrlSchema

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "Description is required"),
  category: productCategorySchema,
  priceInDollars: z.number().positive("Price must be positive"),
  stock: z.int().min(0, "Stock cannot be negative"),
  featured: z.boolean(),
  active: z.boolean(),
  images: z.array(productImageUrlSchema),
})

export type ProductFormInput = z.infer<typeof productFormSchema>

export const checkoutSchema = z.object({
  email: z.email(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.int().min(1).max(MAX_CHECKOUT_QUANTITY),
      })
    )
    .min(1)
    .max(MAX_CHECKOUT_LINE_ITEMS),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

export const customRequestSchema = z.object({
  customerEmail: z.string().trim().pipe(z.email()),
  customerName: z.string().trim().min(2, "Enter your name.").max(100),
  itemDescription: z
    .string()
    .trim()
    .min(20, "Tell us a little more about the object or vision.")
    .max(2000),
  referenceImages: z.array(blobImageUrlSchema).max(MAX_CUSTOM_REFERENCE_IMAGES).default([]),
  budgetRange: z.enum(["25", "35", "50"]),
})

export type CustomRequestInput = z.infer<typeof customRequestSchema>

export const customRequestAdminSchema = z.object({
  status: z.enum(["pending", "quoted", "paid", "prep", "assembly", "shipping", "shipped", "cancelled"]),
  quotedPriceInDollars: z.number().min(0).optional(),
  stripePaymentLinkId: z.string().trim().optional(),
})

export type CustomRequestAdminInput = z.infer<typeof customRequestAdminSchema>

export const adminLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>
