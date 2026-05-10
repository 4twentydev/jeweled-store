<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project Context

JWLD is a luxury minimalist ecommerce store for handmade bejeweled accessories.

Primary stack:

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, shadcn-style local UI primitives, Framer Motion
- Neon Postgres through Drizzle ORM
- Stripe Checkout and Stripe webhooks
- Vercel Blob for product and custom-request images
- Zod for all request and form validation
- Bun for scripts, tests, and lockfile management

Also read:

- `docs/AGENT_RULES.md` for the original hard rules
- `docs/DESIGN_SYSTEM.md` before visual changes
- `docs/QA_CHECKLIST.md` before release-facing work

## Hard Rules

- Use App Router only. Do not add Pages Router or a `src` directory.
- Server components are the default. Use client components only for browser state, effects, animation, or direct interaction.
- Validate all API route and server action inputs with Zod schemas from `lib/validators.ts` or a nearby schema.
- Use Drizzle for database access. Keep schema changes in `db/schema.ts` and generate migrations with `bun run db:generate`.
- Stripe webhooks are the payment source of truth. Never mark an order paid from the client success page.
- Preserve checkout inventory semantics: checkout reserves stock, webhook fulfillment finalizes or refunds, and duplicate webhooks must remain idempotent.
- Do not run broad reservation cleanup inside logic that is processing a paid checkout unless the current session/reservation is protected from accidental release.
- Protect public write endpoints with origin checks, rate limits, size limits, and content validation.
- Uploaded product/custom-request images must go through Vercel Blob and be normalized with Sharp.
- Do not store secrets in source control. Required runtime env includes `DATABASE_URL`, Stripe keys, `NEXT_PUBLIC_APP_URL`, admin credentials, and blob/OpenAI keys for their respective features.
- Do not hardcode product catalog data outside seed files, metadata files, or database access layers.
- Do not add dependencies without a clear reason.

## Design Rules

- Keep the store restrained, editorial, and expensive-feeling.
- Use almost black / almost white as the base palette and a single controlled accent sparingly.
- Avoid generic SaaS sections, pill-heavy UI, and decorative clutter.
- Prefer real product imagery and clear inspection over atmospheric or placeholder visuals.
- Check mobile layouts, touch targets, cart states, and product detail pages after visual work.

## Commands

Use Bun:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Before claiming completion, run at least `bun run lint`, `bun run typecheck`, and relevant tests. For release-facing changes, run the full set above.

`bun run build` prerenders pages that read the database, so it requires a valid `DATABASE_URL`. It may also need network access for `next/font` Google font fetching in a restricted sandbox.

## Review Hotspots

- `app/api/stripe/webhook/route.ts`: payment truth, inventory finalization, refunds, idempotency, notifications, and cache revalidation.
- `app/api/checkout/route.ts`: cart validation, stock reservation, Stripe session metadata, and rollback on session creation failure.
- `lib/reservations.ts`: expired reservation release. Be careful with paid sessions whose webhook arrives after reservation expiry.
- `app/api/custom-request-upload/route.ts`: public blob-writing endpoint. Keep this guarded against storage and CPU abuse.
- `app/api/admin/upload/route.ts` and `app/api/admin/ai-product/route.ts`: image validation, Sharp processing, blob writes, and admin auth.
- `lib/auth.ts`, `proxy.ts`, and `server/actions/auth.ts`: admin session token compatibility and login rate limiting.

## Testing Notes

- Existing Vitest coverage focuses on checkout, webhook behavior, and order lookup.
- Add or update tests when changing inventory reservations, webhook idempotency, order lookup privacy, auth, or public write endpoints.
- Prefer focused tests that mock Stripe, Drizzle, and external services rather than hitting real network services.
