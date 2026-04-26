import { z } from "zod"

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
