import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export type OrderStatus = "new" | "prep" | "assembly" | "shipping" | "shipped" | "cancelled"
export type CustomRequestStatus = "pending" | "quoted" | "paid" | "prep" | "assembly" | "shipping" | "shipped" | "cancelled"
export type UserRole = "admin"

export type ShippingAddress = {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").$type<UserRole>().notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    priceCents: integer("price_cents").notNull(),
    stripePriceId: text("stripe_price_id"),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    stock: integer("stock").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("products_active_idx").on(t.active),
    index("products_featured_idx").on(t.featured),
  ]
)

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull().unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    customerEmail: text("customer_email"),
    customerName: text("customer_name"),
    status: text("status").$type<OrderStatus>().notNull().default("new"),
    totalCents: integer("total_cents").notNull(),
    shipping: jsonb("shipping").$type<ShippingAddress>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("orders_customer_email_idx").on(t.customerEmail)]
)

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(),
})

export const customRequests = pgTable("custom_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  itemDescription: text("item_description").notNull(),
  referenceImages: jsonb("reference_images").$type<string[]>().notNull().default([]),
  budgetRange: text("budget_range").notNull(),
  status: text("status").$type<CustomRequestStatus>().notNull().default("pending"),
  quotedPrice: integer("quoted_price"),
  stripePaymentLinkId: text("stripe_payment_link_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const adminLoginAttempts = pgTable(
  "admin_login_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ip: text("ip").notNull(),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  },
  (t) => [index("admin_login_attempts_ip_at_idx").on(t.ip, t.attemptedAt)]
)

export const ordersRelations = relations(orders, ({ many }) => ({
  orderItems: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))
