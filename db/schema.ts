// db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
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
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id")
    .notNull()
    .unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  customerEmail: text("customer_email"),
  status: text("status").notNull().default("pending"),
  totalCents: integer("total_cents").notNull(),
  items: jsonb("items").notNull(),
  shipping: jsonb("shipping"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
