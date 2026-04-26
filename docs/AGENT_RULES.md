# Agent Rules

This project is a luxury minimalist ecommerce store for bejeweled accessories.

## Stack

- Next.js 16+ App Router
- TypeScript
- Tailwind CSS 4+
- shadcn/ui
- Framer Motion
- Neon Postgres
- Drizzle ORM
- Stripe Checkout
- Zod
- Bun
- GitHub
- Vercel

## Hard rules

- Use App Router only.
- No Pages Router.
- No src directory.
- Use server components by default.
- Use client components only when interaction requires them.
- Use Zod for input validation.
- Use Drizzle for all database access.
- Use Stripe webhooks as the source of payment truth.
- Never mark an order paid from the client success page alone.
- Keep visual design minimalist, luxury, almost black / almost white.
- Use random accent color sparingly.
- Avoid generic SaaS-looking sections.
- Do not add dependencies without explaining why.
- Do not store secrets in source control.
- Do not hardcode product data outside seed files or database access layers.

## Required checks before completion

Run:

bun run typecheck
bun run build

If a command fails, fix the failure before claiming completion.
