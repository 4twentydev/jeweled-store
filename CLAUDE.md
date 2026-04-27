# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
bun run dev          # start dev server
bun run build        # production build
bun run typecheck    # tsc --noEmit
bun run lint         # eslint
bun run db:generate  # generate Drizzle migrations
bun run db:migrate   # apply migrations
bun run db:studio    # Drizzle Studio GUI
bun run db:seed      # seed products (blocked in NODE_ENV=production)
```

**Before claiming any task complete, run `bun run typecheck && bun run build` and fix all errors.**

## Next.js 16 Breaking Changes

This project targets Next.js 16. Key differences from prior versions:

- **`middleware.ts` is renamed `proxy.ts`** — never create `middleware.ts`. The route-protection logic lives in `proxy.ts` at the project root.
- **`params` and `searchParams` are Promises** — always `await` them in page/layout components before accessing properties.
- Consult `node_modules/next/dist/docs/` before writing any framework-specific code.

## Architecture

### Directory layout

```
app/
  layout.tsx          # root layout — CartProvider, accent color inline script
  (site)/             # public storefront (route group, no URL segment)
  admin/              # protected admin panel
  api/                # API routes (checkout, stripe webhook, products, orders, custom-requests)
lib/                  # shared utilities and context
  auth.ts             # HMAC cookie helpers (server-only)
  cart-context.tsx    # client-side cart state (localStorage)
  env.ts              # Zod-validated env accessor (getEnv())
  stripe.ts           # Stripe client singleton
  utils.ts            # cn(), formatCurrency()
db/
  index.ts            # getDb() singleton — Drizzle + Neon HTTP
  schema.ts           # all table definitions and relations
server/
  actions/            # Next.js Server Actions (admin.ts, auth.ts, cart.ts, checkout.ts, products.ts)
components/           # React components (admin/, product/, sections/, ui/, site/, shared)
docs/                 # PROJECT_SPEC.md, DESIGN_SYSTEM.md, AGENT_RULES.md, QA_CHECKLIST.md
drizzle/              # generated migration files
scripts/seed.ts       # product seeding script
proxy.ts              # Next.js edge middleware (admin route protection)
```

### Database

- Driver: `drizzle-orm/neon-http` via `@neondatabase/serverless` — **does not support `db.transaction()`**.
- Use `db.batch([...])` for atomic multi-query operations.
- Access the DB via `getDb()` from `db/index.ts` (singleton).
- All prices are stored as **integer cents** (`priceCents`). Use `formatCurrency()` from `lib/utils.ts` to display them.
- Schema entities: `users`, `products`, `orders`, `orderItems`, `customRequests`.

### Admin authentication

- Single shared password via `ADMIN_PASSWORD` env var. No user accounts for admin in MVP.
- On login, a HMAC-signed session token is issued as an `httpOnly` cookie named `jwld_admin` (7-day TTL, signed with `ADMIN_SECRET`).
- `proxy.ts` guards all `/admin/**` routes except `/admin/login` by verifying the cookie at the edge.
- Server-side helpers: `isAdmin()`, `setAdminCookie()`, `clearAdminCookie()` in `lib/auth.ts`.

### Stripe / payments

- **Stripe webhooks are the authoritative source of payment truth.** Never mark an order paid from the client `/success` page alone.
- Webhook handler: `app/api/stripe/webhook/route.ts` — verifies signature, then uses `db.batch()` with a pre-generated UUID to atomically insert order + items and decrement stock (`gte()` guard prevents negative stock).
- Cart lives client-side only (`CartProvider` in `lib/cart-context.tsx`). Checkout creates a Stripe Checkout Session via `app/api/checkout/route.ts`.

### Env vars

All env vars are accessed through `getEnv()` from `lib/env.ts`, which validates them with Zod on first call:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `STRIPE_SECRET_KEY` | Stripe server key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_SECRET` | HMAC signing key (min 32 chars) |

### Design system

Colors are CSS variables; accent is randomized per page load via an inline `<script>` in `app/layout.tsx`:

- Almost black: `#050505` / soft black: `#101010`
- Almost white: `#f7f4ef` / muted white: `#e9e4dc`
- Accent (`--jwld-accent`): one of lilac `#C8A2C8`, gold `#D4AF37`, pink `#FF5CA8`, blue `#7DF9FF`, lime `#B6FF7D`

Rules: sharp corners (`rounded-none` or minimal rounding), heavy whitespace, accent used sparingly (underlines, button glow, badges, cart count). The product has sparkle; the site must feel expensive and restrained.

### Component conventions

- Server components by default; add `"use client"` only where interactivity requires it.
- UI primitives come from shadcn/ui (`components/ui/`) heavily re-themed to remove SaaS aesthetics.
- Animations via Framer Motion — subtle fade-ins and staggered reveals only. No bouncing or aggressive easing.
- `cn()` from `lib/utils.ts` for conditional Tailwind classes.
