import { z } from "zod"

export const PRODUCT_CATEGORIES = [
  { value: "bejeweled-lighters", label: "Bejeweled Lighters" },
  { value: "lighter-cases", label: "Lighter Cases" },
  { value: "small-cases", label: "Small Cases" },
  { value: "lip-balms", label: "Lip Balms" },
  { value: "lotions", label: "Lotions" },
  { value: "custom-rhinestone-items", label: "Custom Rhinestone Items" },
] as const

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  priceInDollars: z.number().positive("Price must be positive"),
  stock: z.int().min(0, "Stock cannot be negative"),
  featured: z.boolean(),
  active: z.boolean(),
})

export type ProductFormInput = z.infer<typeof productFormSchema>

export const checkoutSchema = z.object({
  email: z.email(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.int().min(1),
      })
    )
    .min(1),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

export const customRequestSchema = z.object({
  customerEmail: z.email(),
  customerName: z.string().min(2).max(100),
  itemDescription: z.string().min(20).max(2000),
  referenceImages: z.array(z.string().url()).max(5).default([]),
  budgetRange: z.enum(["under-200", "200-500", "500-1000", "1000-2500", "2500-plus"]),
})

export type CustomRequestInput = z.infer<typeof customRequestSchema>

export const adminLoginSchema = z.object({
  password: z.string().min(1),
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>
