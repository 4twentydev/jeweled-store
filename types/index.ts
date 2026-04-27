import type { InferSelectModel } from "drizzle-orm"
import type {
  products,
  orders,
  orderItems,
  customRequests,
  users,
} from "@/db/schema"

export type Product = InferSelectModel<typeof products>
export type Order = InferSelectModel<typeof orders>
export type OrderItem = InferSelectModel<typeof orderItems>
export type CustomRequest = InferSelectModel<typeof customRequests>
export type User = InferSelectModel<typeof users>

export type CartItem = {
  productId: string
  slug: string
  name: string
  priceCents: number
  image: string | null
  quantity: number
  maxStock: number
}
