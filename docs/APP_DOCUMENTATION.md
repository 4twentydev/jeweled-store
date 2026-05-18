# JWLD App Documentation

JWLD is a luxury minimalist ecommerce application for handmade bejeweled accessories. It supports a public storefront, persistent cart, Stripe Checkout, conservative inventory reservations, order fulfillment admin, custom commission intake, Vercel Blob image uploads, and an AI-assisted product import flow.

This document describes the current app behavior, architecture, data model, operations, and development workflow.

## Contents

- [Product Scope](#product-scope)
- [Architecture](#architecture)
- [Routes](#routes)
- [Core Workflows](#core-workflows)
- [Data Model](#data-model)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Database And Seeds](#database-and-seeds)
- [Stripe Integration](#stripe-integration)
- [Inventory Reservations](#inventory-reservations)
- [Admin](#admin)
- [Custom Requests](#custom-requests)
- [Image Uploads](#image-uploads)
- [AI Product Import](#ai-product-import)
- [Notifications](#notifications)
- [Security Controls](#security-controls)
- [Deployment](#deployment)
- [Testing And QA](#testing-and-qa)
- [Troubleshooting](#troubleshooting)

## Product Scope

The public store lets customers browse active products, inspect product details, add items to the cart, submit custom commission requests, and complete checkout through Stripe Hosted Checkout.

The admin area lets operators manage:

- Products, pricing, stock, active status, featured status, and images.
- Paid orders and fulfillment status.
- Custom commission requests, quotes, and payment links.
- Notification delivery state.
- AI-generated product drafts from reference photos.

Payment truth lives in Stripe webhooks. The success page is only a confirmation and lookup page; it does not mark orders as paid.

## Architecture

The app uses:

- Next.js 16 App Router and React 19.
- Server Components by default.
- Client Components only for browser state, cart interaction, uploads, forms, animation, and direct UI interaction.
- TypeScript for app code.
- Tailwind CSS 4 and local shadcn-style primitives for styling.
- Drizzle ORM with Neon Postgres for persistence.
- Stripe Checkout and Stripe webhooks for payments.
- Vercel Blob for uploaded and generated images.
- Sharp for image normalization.
- Zod for validation.
- Bun for scripts, tests, and lockfile management.

### Important Directories

```text
app/                         App Router routes, layouts, pages, API handlers
app/(site)/                  Public storefront route group
app/admin/                   Admin dashboard pages
app/api/                     HTTP API routes
components/                  Shared UI, storefront, cart, admin components
db/                          Drizzle schema, database client, query helpers
drizzle/                     Generated SQL migrations and metadata
lib/                         Auth, env, validators, checkout, reservations, uploads
server/actions/              Server Actions used by forms and admin workflows
scripts/                     Product seed and migration utilities
__tests__/                   Vitest tests
docs/                        Project, operator, Stripe, QA, and design documentation
```

## Routes

### Public Pages

| Route | Purpose |
| --- | --- |
| `/` | Homepage with hero, featured products, category strip, manifesto, and custom CTA. |
| `/products` | Active product collection. |
| `/product/[slug]` | Product detail page for active products. |
| `/cart` | Cart review and checkout entry. |
| `/checkout` | Checkout-facing page shell. |
| `/success?session_id=...&lookup_token=...` | Post-Stripe order confirmation lookup. |
| `/custom` | Custom commission intake. |
| `/about` | Brand and workshop context. |
| `/contact` | Contact page. |
| `/privacy` | Privacy policy. |
| `/terms` | Terms page. |

### Admin Pages

| Route | Purpose |
| --- | --- |
| `/admin/login` | Admin login. |
| `/admin` | Dashboard metrics and recent notification state. |
| `/admin/products` | Product list, search, pagination, active toggle. |
| `/admin/products/new` | Manual product creation and AI product generator. |
| `/admin/products/[id]/edit` | Product editing. |
| `/admin/orders` | Paid orders list. |
| `/admin/orders/[id]` | Order detail and fulfillment status update. |
| `/admin/custom-requests` | Custom commission request list. |
| `/admin/custom-requests/[id]` | Custom request review, quote, payment link, and status update. |

### API Routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/products` | `GET` | Product data endpoint. |
| `/api/checkout` | `POST` | Validates cart, reserves stock, creates Stripe Checkout Session. |
| `/api/stripe/webhook` | `POST` | Verifies Stripe signature, creates/cancels orders, fulfills/releases reservations. |
| `/api/custom-requests` | `POST` | Validates and stores public custom commission requests. |
| `/api/custom-request-upload` | `POST` | Public custom request image upload to Vercel Blob. |
| `/api/admin/upload` | `POST` | Admin-only product image upload to Vercel Blob. |
| `/api/admin/ai-product` | `POST` | Admin-only AI product draft and image generation. |
| `/api/cron/reconcile-reservations` | `GET` | Protected cron route for stale Stripe session reservation reconciliation. |

## Core Workflows

### Standard Purchase

1. Customer browses active products from Postgres.
2. Customer adds products to the client cart.
3. Cart submits email and line items to `/api/checkout`.
4. Checkout API validates input with Zod.
5. Checkout API rate limits the request and checks origin.
6. Checkout API aggregates duplicate product IDs.
7. Product rows are loaded and stock is checked.
8. Product stock is decremented immediately to reserve inventory.
9. Reservation rows are created with a reservation token and expiry.
10. Stripe Checkout Session is created with line items, metadata, shipping, success URL, and cancel URL.
11. Reservation rows are updated with the Stripe session ID.
12. Customer pays on Stripe.
13. Stripe sends `checkout.session.completed`.
14. Webhook verifies the signature and validates session metadata.
15. Webhook creates an order and order items, marks reservations fulfilled, queues notifications, and revalidates affected pages.
16. Customer returns to `/success` with `session_id` and `lookup_token`.
17. Success page looks up the order with both values.

### Abandoned Checkout

1. Customer starts checkout, creating reservations and decrementing stock.
2. Customer does not complete Stripe Checkout.
3. Stripe sends `checkout.session.expired`.
4. Webhook releases reservations for that session and restores stock.
5. The daily cron also reconciles stale expired Stripe sessions as a backup.

### Inventory Race Or Unfulfillable Paid Session

If a paid checkout cannot be fulfilled, the webhook:

- Creates a cancelled order when possible.
- Releases any reservation tied to the session.
- Attempts a Stripe refund with an idempotency key.
- Queues customer and admin cancellation notifications.

Duplicate webhook delivery is handled by checking the unique `stripe_checkout_session_id` before insert and by treating PostgreSQL unique constraint errors as already-processed deliveries.

## Data Model

The canonical schema is in `db/schema.ts`.

### `users`

Admin user table for the MVP.

| Column | Notes |
| --- | --- |
| `id` | UUID primary key. |
| `email` | Unique email. |
| `role` | Currently `admin`. |
| `created_at` | Creation timestamp. |

### `products`

Product catalog.

| Column | Notes |
| --- | --- |
| `id` | UUID primary key. |
| `slug` | Unique URL slug. |
| `name` | Customer-facing name. |
| `description` | Customer-facing copy. |
| `category` | Product category enum. |
| `price_cents` | Integer price in cents. |
| `stripe_price_id` | Optional, currently not required by dynamic Checkout Session line items. |
| `images` | JSON array of Vercel Blob URLs. |
| `stock` | Available inventory count. |
| `featured` | Homepage/featured placement flag. |
| `active` | Public visibility flag. |
| `created_at` | Creation timestamp. |

Indexes exist for active and featured queries.

### `orders`

Orders created from Stripe checkout sessions.

| Column | Notes |
| --- | --- |
| `id` | UUID primary key. |
| `stripe_checkout_session_id` | Unique Stripe Checkout Session ID. |
| `stripe_payment_intent_id` | Stripe PaymentIntent ID when available. |
| `lookup_token` | Private token used by the success page lookup. |
| `customer_email` | Stripe customer email. |
| `customer_name` | Stripe customer name. |
| `status` | `new`, `prep`, `assembly`, `shipping`, `shipped`, or `cancelled`. |
| `total_cents` | Stripe total amount. |
| `shipping` | JSON shipping address. |
| `created_at` | Creation timestamp. |

An index exists on `customer_email`.

### `order_items`

Line items for each order.

| Column | Notes |
| --- | --- |
| `id` | UUID primary key. |
| `order_id` | References `orders.id`, cascades on delete. |
| `product_id` | References `products.id`. |
| `quantity` | Purchased quantity. |
| `price_at_purchase` | Product price in cents at checkout time. |

### `custom_requests`

Custom commission intake and admin quote tracking.

| Column | Notes |
| --- | --- |
| `id` | UUID primary key. |
| `customer_email` | Customer email. |
| `customer_name` | Customer name. |
| `item_description` | Customer description. |
| `reference_images` | JSON array of uploaded Blob URLs. |
| `budget_range` | Public budget option. |
| `status` | `pending`, `quoted`, `paid`, `prep`, `assembly`, `shipping`, `shipped`, or `cancelled`. |
| `quoted_price` | Quote amount in cents. |
| `stripe_payment_link_id` | Stored Stripe payment link or link ID. |
| `created_at` | Creation timestamp. |

### Rate Limit Tables

The app stores rate-limit attempts in Postgres for:

- `admin_login_attempts`
- `custom_request_attempts`
- `custom_request_upload_attempts`
- `checkout_attempts`

Each table stores an IP and timestamp with an index for cleanup/window queries.

### `product_reservations`

Tracks checkout inventory holds.

| Column | Notes |
| --- | --- |
| `id` | UUID primary key. |
| `reservation_token` | Checkout reservation token. |
| `stripe_checkout_session_id` | Stripe session after session creation. |
| `product_id` | Reserved product. |
| `quantity` | Reserved quantity. |
| `customer_email` | Customer email used at checkout start. |
| `expires_at` | Reservation expiry. |
| `fulfilled_at` | Set after paid webhook creates order. |
| `released_at` | Set after abandoned/expired checkout is released. |
| `created_at` | Creation timestamp. |

### `notification_events`

Queue and audit table for notification delivery.

| Column | Notes |
| --- | --- |
| `id` | UUID primary key. |
| `kind` | Notification type. |
| `channel` | `email` or `admin` in current flows. |
| `recipient` | Recipient email when available. |
| `subject` | Notification subject. |
| `payload` | JSON payload. |
| `status` | `pending`, `sent`, `failed`, or `skipped`. |
| `external_id` | Provider message ID when available. |
| `error_message` | Last delivery error. |
| `created_at` | Creation timestamp. |
| `sent_at` | Delivery timestamp. |

## Environment Variables

Create `.env.local` for development. Configure equivalent values in Vercel for preview and production as needed.

### Required For Core Runtime

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string. |
| `STRIPE_SECRET_KEY` | Stripe secret API key. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret. |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL, for origin checks and Stripe redirects. |
| `ADMIN_EMAIL` | Admin login email. |
| `ADMIN_PASSWORD` | Admin login password. |
| `ADMIN_SECRET` | HMAC signing secret for admin sessions, minimum 32 characters. |

### Required For Specific Features

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Required for admin uploads, custom request uploads, and AI-generated product images. |
| `OPENAI_API_KEY` | Required for AI product import. |

### Optional

| Variable | Purpose |
| --- | --- |
| `OPENAI_TEXT_MODEL` | Metadata generation model. Defaults to `gpt-4o`. |
| `OPENAI_IMAGE_MODEL` | Image generation/edit model. Defaults to `gpt-image-1`. |
| `RESEND_API_KEY` | Enables email notification delivery through Resend. |
| `ADMIN_NOTIFICATION_EMAIL` | Admin notification recipient and email sender. Falls back to `ADMIN_EMAIL`. |
| `CRON_SECRET` | Bearer token required by reservation reconciliation cron. |

Do not commit real secrets.

## Local Development

Install dependencies:

```bash
bun install
```

Run the dev server:

```bash
bun run dev
```

Run validation:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

`bun run build` prerenders pages that read the database, so it needs a valid `DATABASE_URL`. In restricted environments, font fetching or other network access can also affect builds.

## Database And Seeds

Generate migrations after changing `db/schema.ts`:

```bash
bun run db:generate
```

Apply migrations:

```bash
bun run db:migrate
```

Seed products:

```bash
bun run db:seed
```

Open Drizzle Studio:

```bash
bun run db:studio
```

Catalog metadata and seed files live in:

```text
data/products/metadata/
lib/products-seed.json
scripts/seed-products.json
scripts/seed.ts
```

Product catalog data should stay in seed files, metadata files, or database access layers.

## Stripe Integration

The checkout API creates Stripe Checkout Sessions with dynamic `price_data` from current product rows. It stores these metadata fields on the session:

- `lookupToken`
- `reservationToken`
- `items`, a JSON array of product IDs, quantities, and price cents.

The webhook listens for:

- `checkout.session.completed`
- `checkout.session.expired`

The webhook validates:

- Stripe signature.
- Supported event type.
- Paid status for completed sessions.
- Metadata item shape.
- Stripe subtotal against item subtotal when Stripe provides `amount_subtotal`.

Shipping is configured in the checkout session and currently allows the United States and Canada.

For operator setup instructions, see `docs/STRIPE_PAYMENTS_README.md`.

## Inventory Reservations

Inventory reservation behavior is intentionally conservative.

- Checkout decrements product stock before redirecting the customer to Stripe.
- The reservation window is 30 minutes.
- Reservation rows are created before the Stripe session exists.
- After Stripe session creation, reservations are attached to `stripe_checkout_session_id`.
- If Stripe session creation fails, reserved stock is rolled back.
- If Stripe reports session expiry, stock is restored.
- If Stripe reports payment completion, reservations are fulfilled.

`cleanupExpiredReservations()` only releases expired reservations that never received a Stripe session ID. Reservations attached to Stripe sessions are released by Stripe expiry webhook or by the protected reconciliation cron after confirming the Stripe session is expired.

This separation protects paid sessions whose webhook arrives after the local reservation expiry time.

## Admin

Admin auth uses:

- `ADMIN_EMAIL` and `ADMIN_PASSWORD` for login.
- Constant-time HMAC comparison for password verification.
- A signed `jwld_admin` HTTP-only cookie.
- `ADMIN_SECRET` as the signing key.
- A 7-day cookie max age.
- Login rate limiting by IP.

Admin-only actions call `isAdmin()` or redirect to `/admin/login`.

Product admin supports:

- Create product.
- Edit product.
- Toggle active status.
- Upload product images.
- Generate AI product drafts.
- Search and page through product list.

Order admin supports:

- Review customer and shipping details.
- Review line items and totals.
- Update order status through the workshop states.

Custom request admin supports:

- Review customer request details and reference images.
- Set quote amount.
- Store Stripe payment link.
- Update request status.
- Queue a customer quote notification when status is `quoted` and quote/link data are present.

For non-technical operator instructions, see `docs/ADMIN_INVENTORY_README.md`.

## Custom Requests

Public custom request submission requires:

- `customerEmail`
- `customerName`
- `itemDescription`
- `referenceImages`
- `budgetRange`

Validation rules include:

- Email must be valid.
- Name must be 2 to 100 characters.
- Description must be 20 to 2000 characters.
- At most 5 reference images.
- Budget must be one of the supported public budget values.
- Reference images must be HTTPS Vercel Blob URLs.

The API checks request origin and rate limits by IP before inserting.

Custom request payments are tracked manually through admin-entered Stripe payment links. Standard Stripe Checkout webhooks create product orders automatically; custom payment links are not currently reconciled into orders automatically.

## Image Uploads

All uploaded product/custom request images are normalized through Sharp before they are stored in Vercel Blob.

Shared image validation in `lib/image-upload.ts` enforces:

- Maximum upload size: 10 MB.
- Maximum source dimension: 8000 px.
- MIME type allowlist.
- Magic-byte verification against the declared MIME type.
- Decode verification through Sharp.
- EXIF rotation.
- Resize to fit within 1600 x 1600 by default.
- WebP output.

Admin product uploads:

- Route: `/api/admin/upload`
- Requires admin session.
- Stores files under `products/`.
- Uses WebP quality 86.

Public custom request uploads:

- Route: `/api/custom-request-upload`
- Checks origin.
- Rate limits uploads by IP.
- Stores files under `custom-requests/`.
- Uses WebP quality 84.

## AI Product Import

AI product import is available on the new product page.

Requirements:

- Admin session.
- `OPENAI_API_KEY`.
- `BLOB_READ_WRITE_TOKEN`.

Flow:

1. Admin uploads up to 4 reference images.
2. Images are validated and normalized.
3. OpenAI text generation returns a structured product draft.
4. OpenAI image generation/editing creates a clean square product image.
5. The generated image is normalized to WebP and uploaded to Vercel Blob.
6. The response is validated with `productFormSchema`.
7. The product form is filled with the generated draft.

The AI route has `maxDuration = 60`. AI output should be treated as a draft; the operator should verify product name, category, description, price, stock, active state, and image accuracy before publishing.

## Notifications

Notifications are queued in `notification_events`.

Current queued events include:

- Customer order confirmation.
- Admin new order notification.
- Customer order cancellation.
- Admin order cancellation.
- Admin new custom request notification.
- Customer quote-ready notification.

`processPendingNotifications()` processes up to 10 pending events at a time.

If `RESEND_API_KEY` is configured, email/admin notifications are sent through Resend. If a recipient is missing, the event is marked `skipped`. If delivery fails, the event is marked `failed` with the error message.

## Security Controls

Important controls already present in the app:

- Zod validation for public request bodies, checkout data, admin forms, and AI draft output.
- Drizzle ORM for database access.
- Stripe webhook signature verification.
- Stripe Checkout Session metadata validation.
- Unique Stripe Checkout Session ID on orders for webhook idempotency.
- Origin checks on public write endpoints.
- IP-based rate limiting for checkout, admin login, custom request submission, and custom request image upload.
- Admin-only checks for admin uploads, AI generation, and admin mutations.
- HTTP-only signed admin session cookie.
- Minimum 32-character `ADMIN_SECRET`.
- Image MIME allowlist, magic-byte checks, file size limit, dimension limit, and Sharp normalization.
- Private success-page order lookup requiring both Stripe session ID and lookup token.
- Protected cron route requiring `Authorization: Bearer ${CRON_SECRET}`.

## Deployment

Recommended hosting target is Vercel.

Before production launch:

1. Configure production environment variables in Vercel.
2. Apply Drizzle migrations to the production Neon database.
3. Configure the production Stripe webhook endpoint:

```text
https://your-domain.com/api/stripe/webhook
```

4. Subscribe the webhook to:

```text
checkout.session.completed
checkout.session.expired
```

5. Connect Vercel Blob and set `BLOB_READ_WRITE_TOKEN`.
6. Set `CRON_SECRET` if using the reservation reconciliation cron.
7. Redeploy after environment changes.
8. Run an end-to-end test purchase.
9. Confirm the order appears in `/admin/orders`.
10. Confirm product stock decreased.
11. Confirm Stripe webhook logs show successful `200` responses.

`vercel.json` defines a daily cron:

```text
0 8 * * * -> /api/cron/reconcile-reservations
```

## Testing And QA

Run:

```bash
bun run lint
bun run typecheck
bun run test
```

For release-facing changes, also run:

```bash
bun run build
```

Existing Vitest coverage includes:

- Checkout behavior.
- Stripe webhook behavior.
- Inventory reservations.
- Custom requests.
- Custom request uploads.
- Admin auth.
- AI product upload.
- Order lookup privacy.

Add or update tests when changing:

- Checkout inventory semantics.
- Stripe webhook fulfillment or idempotency.
- Reservation cleanup/reconciliation.
- Admin auth.
- Public write endpoints.
- Upload validation.
- Order lookup privacy.

Before release-facing work, use `docs/QA_CHECKLIST.md`.

## Troubleshooting

### Checkout Does Not Start

Check:

- `STRIPE_SECRET_KEY` is configured.
- `NEXT_PUBLIC_APP_URL` matches the current origin.
- Product is active.
- Product stock is greater than zero.
- Checkout rate limit has not been exceeded.
- Stripe API call is succeeding.

### Payment Succeeds But No Order Appears

Check:

- Stripe webhook endpoint is configured.
- `STRIPE_WEBHOOK_SECRET` matches the endpoint and mode.
- The webhook is subscribed to `checkout.session.completed`.
- Stripe webhook delivery logs show `200`.
- The app logs do not show metadata validation or database errors.

### Stock Does Not Return After Abandoned Checkout

Check:

- The webhook is subscribed to `checkout.session.expired`.
- Stripe sent the expiry event.
- `CRON_SECRET` is configured if relying on the daily reconciler.
- The reservation has `stripe_checkout_session_id`, `fulfilled_at`, or `released_at` in the expected state.

### Image Upload Fails

Check:

- `BLOB_READ_WRITE_TOKEN` is configured.
- File is under 10 MB.
- Image dimensions are not over 8000 px.
- File type is JPEG, PNG, WebP, GIF, or AVIF for standard uploads.
- File content matches its declared MIME type.

### AI Product Generation Fails

Check:

- Admin is logged in.
- `OPENAI_API_KEY` is configured.
- `BLOB_READ_WRITE_TOKEN` is configured.
- Uploaded files are supported image types.
- The route has enough runtime duration for generation.
- OpenAI API errors in server logs.

### Admin Login Fails

Check:

- `ADMIN_EMAIL` matches the login email.
- `ADMIN_PASSWORD` is correct.
- `ADMIN_SECRET` is set and at least 32 characters.
- Login rate limit has not been exceeded.
- Cookie settings are valid for the environment.

