import { z } from "zod";

export const checkoutSchema = z.object({
  email: z.email(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.int().min(1),
      })
    )
    .min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
