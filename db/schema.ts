import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  index,
  pgEnum,
  check,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"

export type OrderStatus = "new" | "prep" | "assembly" | "shipping" | "shipped" | "cancelled"
export type CustomRequestStatus = "pending" | "quoted" | "paid" | "prep" | "assembly" | "shipping" | "shipped" | "cancelled"
export type UserRole = "admin"
export type ProductCategory =
  | "bejeweled-lighters"
  | "lighter-cases"
  | "small-cases"
  | "lip-balms"
  | "lotions"
  | "custom-rhinestone-items"

export type ShippingAddress = {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export const productCategoryEnum = pgEnum("product_category", [
  "bejeweled-lighters",
  "lighter-cases",
  "small-cases",
  "lip-balms",
  "lotions",
  "custom-rhinestone-items",
])

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
    category: productCategoryEnum("category").$type<ProductCategory>().notNull(),
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
    check("products_price_cents_positive", sql`${t.priceCents} > 0`),
    check("products_stock_nonnegative", sql`${t.stock} >= 0`),
  ]
)

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull().unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    lookupToken: text("lookup_token"),
    customerEmail: text("customer_email"),
    customerName: text("customer_name"),
    status: text("status").$type<OrderStatus>().notNull().default("new"),
    totalCents: integer("total_cents").notNull(),
    shipping: jsonb("shipping").$type<ShippingAddress>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("orders_customer_email_idx").on(t.customerEmail),
    check("orders_total_cents_nonnegative", sql`${t.totalCents} >= 0`),
    check(
      "orders_status_valid",
      sql`${t.status} in ('new', 'prep', 'assembly', 'shipping', 'shipped', 'cancelled')`
    ),
  ]
)

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    priceAtPurchase: integer("price_at_purchase").notNull(),
  },
  (t) => [
    check("order_items_quantity_positive", sql`${t.quantity} > 0`),
    check("order_items_price_at_purchase_positive", sql`${t.priceAtPurchase} > 0`),
  ]
)

export const customRequests = pgTable(
  "custom_requests",
  {
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
  },
  (t) => [
    check("custom_requests_budget_range_valid", sql`${t.budgetRange} in ('25', '35', '50')`),
    check(
      "custom_requests_status_valid",
      sql`${t.status} in ('pending', 'quoted', 'paid', 'prep', 'assembly', 'shipping', 'shipped', 'cancelled')`
    ),
    check(
      "custom_requests_quoted_price_nonnegative",
      sql`${t.quotedPrice} is null or ${t.quotedPrice} >= 0`
    ),
  ]
)

export const adminLoginAttempts = pgTable(
  "admin_login_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ip: text("ip").notNull(),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  },
  (t) => [index("admin_login_attempts_ip_at_idx").on(t.ip, t.attemptedAt)]
)

export const customRequestAttempts = pgTable(
  "custom_request_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ip: text("ip").notNull(),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  },
  (t) => [index("custom_request_attempts_ip_at_idx").on(t.ip, t.attemptedAt)]
)

export const customRequestUploadAttempts = pgTable(
  "custom_request_upload_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ip: text("ip").notNull(),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  },
  (t) => [index("custom_request_upload_attempts_ip_at_idx").on(t.ip, t.attemptedAt)]
)

export const checkoutAttempts = pgTable(
  "checkout_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ip: text("ip").notNull(),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  },
  (t) => [index("checkout_attempts_ip_at_idx").on(t.ip, t.attemptedAt)]
)

export const productReservations = pgTable(
  "product_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reservationToken: text("reservation_token").notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    customerEmail: text("customer_email").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    fulfilledAt: timestamp("fulfilled_at"),
    releasedAt: timestamp("released_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("product_reservation_token_idx").on(t.reservationToken),
    index("product_reservation_session_idx").on(t.stripeCheckoutSessionId),
    index("product_reservation_expiry_idx").on(t.expiresAt),
    check("product_reservations_quantity_positive", sql`${t.quantity} > 0`),
  ]
)

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: text("kind").notNull(),
    channel: text("channel").notNull(),
    recipient: text("recipient"),
    subject: text("subject"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: text("status").notNull().default("pending"),
    externalId: text("external_id"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    sentAt: timestamp("sent_at"),
  },
  (t) => [
    index("notification_events_kind_idx").on(t.kind, t.createdAt),
    check(
      "notification_events_status_valid",
      sql`${t.status} in ('pending', 'sent', 'failed', 'skipped')`
    ),
  ]
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
