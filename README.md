# JWLD Store

JWLD is a minimalist luxury ecommerce store for handmade bejeweled accessories. It includes a public storefront, cart, Stripe Checkout, inventory reservations, order fulfillment admin, custom commission requests, product image uploads, and an AI-assisted product import workflow.

The app is built with Next.js App Router, React, TypeScript, Tailwind CSS, Drizzle, Neon Postgres, Stripe, Vercel Blob, and Bun.

## What This Store Does

- Public storefront with homepage, product collection, product detail pages, cart, checkout, success, about, contact, privacy, terms, and custom request pages.
- Product catalog stored in Postgres, not hardcoded in the UI.
- Cart checkout through Stripe Hosted Checkout.
- Inventory is reserved when checkout starts and finalized by Stripe webhook events.
- Admin dashboard for products, orders, custom requests, and notification review.
- Product image uploads through Vercel Blob.
- AI product generator that turns product reference photos into draft catalog fields and a clean catalog image.
- Custom commission intake with uploaded reference images, quote amount, Stripe payment link storage, and email notification support.

## Main Workflows

### Product Purchase

1. A customer browses active products.
2. The customer adds products to the cart.
3. Checkout creates a Stripe Checkout Session.
4. Stock is reserved while the customer is in Stripe Checkout.
5. Stripe sends a webhook after payment succeeds or the session expires.
6. The webhook creates the order, finalizes the reservation, sends notifications, and refreshes product/admin pages.
7. If checkout expires, reserved stock is released.

Payment state comes from Stripe webhooks. The success page is only a customer-facing confirmation view.

### Admin Product Management

Admins can:

- Create products.
- Edit product name, slug, description, category, price, stock, featured status, active status, and images.
- Upload product images.
- Toggle products active or inactive from the product list.
- Search and page through products.
- Use the AI generator on the new product screen.

See [docs/ADMIN_INVENTORY_README.md](docs/ADMIN_INVENTORY_README.md) for a non-technical guide.

### Custom Requests

Customers can submit custom commission requests with contact details, a description, budget range, and reference images. Admins can review the request, set a quote amount, paste a Stripe payment link, update the workshop status, and send the customer a quote email when notification email is configured.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Local shadcn-style UI primitives
- Framer Motion
- Neon Postgres
- Drizzle ORM
- Stripe Checkout and Stripe webhooks
- Vercel Blob
- OpenAI API for AI product import
- Zod validation
- Vitest
- Bun

## Project Structure

```text
app/                         Next.js App Router routes
app/(site)/                  Public storefront routes
app/admin/                   Admin dashboard routes
app/api/checkout/            Stripe Checkout session creation
app/api/stripe/webhook/      Stripe webhook payment source of truth
app/api/admin/upload/        Admin product image upload
app/api/admin/ai-product/    AI product draft and catalog image generation
components/                  Shared storefront, cart, admin, and UI components
db/                          Drizzle schema, database client, and queries
drizzle/                     Generated database migrations
lib/                         Validation, auth, Stripe, reservations, uploads, utilities
server/actions/              Server actions for admin, cart, products, auth, checkout
docs/                        Project, QA, design, and operator documentation
scripts/                     Seed and migration helper scripts
__tests__/                   Vitest coverage
```

## Requirements

- Bun
- Node.js compatible with the installed Next.js version
- Neon Postgres database
- Stripe account
- Vercel Blob store for image uploads
- OpenAI API key if using the AI product import feature
- Resend API key if sending customer/admin notification emails

## Environment Variables

Create a local `.env.local` file for development and configure the same values in Vercel for deployment.

```bash
DATABASE_URL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SECRET=
BLOB_READ_WRITE_TOKEN=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=
OPENAI_IMAGE_MODEL=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
```

Required for the core app:

- `DATABASE_URL`: Neon Postgres connection string.
- `STRIPE_SECRET_KEY`: Stripe secret key.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key.
- `STRIPE_WEBHOOK_SECRET`: Signing secret for the Stripe webhook endpoint.
- `NEXT_PUBLIC_APP_URL`: Full site URL, such as `http://localhost:3000` locally or the production domain.
- `ADMIN_EMAIL`: Admin login email.
- `ADMIN_PASSWORD`: Admin login password.
- `ADMIN_SECRET`: Random string at least 32 characters long, used for admin session signing.

Required for image uploads:

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob read/write token.

Required for AI product import:

- `OPENAI_API_KEY`: OpenAI API key.
- `OPENAI_TEXT_MODEL`: Optional. Defaults to `gpt-4o`.
- `OPENAI_IMAGE_MODEL`: Optional. Defaults to `gpt-image-1`.

Optional for email notifications:

- `RESEND_API_KEY`: Resend API key.
- `ADMIN_NOTIFICATION_EMAIL`: Email address used for admin notifications and sender address. If omitted, the admin email is used.

Do not commit `.env.local` or real secret values.

## Development

Install dependencies:

```bash
bun install
```

Run the development server:

```bash
bun run dev
```

Run database migrations:

```bash
bun run db:migrate
```

Seed products when needed:

```bash
bun run db:seed
```

Open Drizzle Studio:

```bash
bun run db:studio
```

## Validation Commands

Use Bun for project commands:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

`bun run build` prerenders pages that read the database, so it needs a valid `DATABASE_URL`. In restricted environments, it may also need network access for font fetching.

## Stripe Setup

Stripe is required for live product payments. At minimum, the app needs:

- Stripe account activated for payments.
- Publishable key in `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Secret key in `STRIPE_SECRET_KEY`.
- Webhook endpoint pointing to `/api/stripe/webhook`.
- Webhook signing secret in `STRIPE_WEBHOOK_SECRET`.

The webhook should listen for:

- `checkout.session.completed`
- `checkout.session.expired`

See [docs/STRIPE_PAYMENTS_README.md](docs/STRIPE_PAYMENTS_README.md) for a non-technical Stripe connection guide.

## Admin Dashboard

The admin dashboard is available at:

```text
/admin
```

Login uses `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Admin sessions are protected by `ADMIN_SECRET`.

Admin sections:

- Dashboard: top-level store statistics and recent notifications.
- Products: catalog, stock, product visibility, product creation, product editing, AI import.
- Orders: paid orders from Stripe webhook processing and fulfillment status updates.
- Custom: custom commission requests, quoted price, Stripe payment link, and workshop status.

## Inventory Behavior

Inventory is intentionally conservative:

- Checkout immediately reserves stock by decrementing product stock.
- A reservation is attached to the Stripe Checkout Session.
- If Stripe reports the checkout expired, the stock is released.
- If Stripe reports payment completed, the order is created and the reservation is fulfilled.
- Duplicate Stripe webhooks are handled idempotently by the unique Stripe session ID.
- If a payment completes but stock cannot be fulfilled, the webhook creates a cancelled order and attempts a refund.

When manually editing stock in admin, use the real number available to sell.

## AI Product Import

The AI product generator appears only when creating a new product. It accepts up to four reference photos, sends them to OpenAI, generates product metadata, creates a square ecommerce product image, uploads that generated image to Vercel Blob, and fills the product form.

Modes:

- `Generate Draft`: fills the form so an admin can review and edit before saving.
- `Generate + Create`: generates the draft and immediately creates the product if validation passes.

The feature requires:

- `OPENAI_API_KEY`
- `BLOB_READ_WRITE_TOKEN`

## Deployment

Recommended deployment target is Vercel.

Before launch:

1. Configure all production environment variables in Vercel.
2. Run Drizzle migrations against the production Neon database.
3. Configure the production Stripe webhook endpoint.
4. Confirm Vercel Blob is connected and `BLOB_READ_WRITE_TOKEN` is set.
5. Configure OpenAI and Resend keys if using AI import or email notifications.
6. Run `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build`.
7. Make a real end-to-end test purchase and refund it in Stripe.
8. Verify admin products, orders, custom requests, and notification records.

## Important Files

- [app/api/checkout/route.ts](app/api/checkout/route.ts): creates Stripe Checkout Sessions and reserves stock.
- [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts): processes paid and expired checkout sessions.
- [lib/reservations.ts](lib/reservations.ts): reservation expiry and cleanup helpers.
- [app/api/admin/upload/route.ts](app/api/admin/upload/route.ts): authenticated admin image upload.
- [app/api/admin/ai-product/route.ts](app/api/admin/ai-product/route.ts): authenticated AI product generator.
- [server/actions/admin.ts](server/actions/admin.ts): admin product, order, and custom request mutations.
- [db/schema.ts](db/schema.ts): database tables, enums, and relationships.
- [lib/validators.ts](lib/validators.ts): Zod validation schemas.

## Operator Guides

- [Stripe payments setup](docs/STRIPE_PAYMENTS_README.md)
- [Admin inventory and AI import](docs/ADMIN_INVENTORY_README.md)
- [QA checklist](docs/QA_CHECKLIST.md)
- [Design system](docs/DESIGN_SYSTEM.md)
