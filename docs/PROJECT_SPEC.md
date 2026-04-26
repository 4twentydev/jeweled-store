# PROJECT_SPEC.md: jwld
**Project:** Luxury Minimalist Ecommerce Webstore — [jwld.store](https://jwld.store)  
**Stack:** Next.js 16+ App Router, TypeScript, Tailwind CSS 4+, Framer Motion, shadcn/ui, Neon Postgres, Drizzle ORM, Stripe Checkout, Zod, Bun, GitHub, Vercel.  
**Brand Aesthetic:** Minimalist luxury. Almost black, almost white, sharp layouts, occasional high-contrast accent color. Not generic SaaS; highly editorial.

---

## 1. Product Categories
* **Lighters:** Pre-designed, fully bejeweled luxury lighters.
* **Lighter Cases:** Interchangeable rhinestone and precious-metal-finish sleeves.
* **Small Cases:** Bejeweled pillboxes, cardholders, and compacts.
* **Beauty:** Crystal-encrusted lip balms and premium lotion dispensers.
* **Custom Commissions:** Bespoke rhinestone application services for user-supplied or custom-ordered items.

## 2. MVP Feature List
* Editorial-style browsing and product discovery.
* High-performance product detail pages (PDP) with high-res galleries.
* Shopping cart functionality (local storage or cookie-based for MVP).
* Seamless Stripe Hosted Checkout integration.
* Custom order request form with robust Zod validation.
* Order success and basic tracking flow.
* Secure Admin Dashboard for order fulfillment and catalog management.

## 3. Future Feature List
* Customer accounts and order history.
* 3D product viewer / WebGL interactive rhinestone reflections.
* "Crystal Crown" tier loyalty and VIP rewards program.
* Waitlists and SMS notifications for limited-edition drops.
* Dynamic inventory syncing with physical workshop materials.
* International shipping and multi-currency support.

## 4. Database Entities (Neon Postgres + Drizzle ORM)
* **`users`** (Admin only for MVP): `id`, `email`, `role`, `created_at`.
* **`products`**: `id`, `name`, `slug`, `description`, `price` (cents), `inventory_count`, `category`, `images` (array), `is_active`, `created_at`.
* **`orders`**: `id`, `stripe_session_id`, `customer_email`, `customer_name`, `shipping_address` (JSON), `total_amount`, `status` (enum), `created_at`.
* **`order_items`**: `id`, `order_id`, `product_id`, `quantity`, `price_at_purchase`.
* **`custom_requests`**: `id`, `customer_email`, `customer_name`, `item_description`, `reference_images` (array), `budget_range`, `status` (enum), `quoted_price`, `created_at`.

## 5. Admin Workflows
The admin panel mimics a streamlined workshop floor, tracking physical goods through precise fabrication stages:
* **Order Fulfillment:** * *New* -> *Prep* (gathering base items and rhinestones) -> *Assembly* (hand-applying jewels) -> *Shipping* (packaging and dispatch).
* **Custom Quotes:** * Review incoming Zod-validated requests.
    * Calculate cost based on materials and labor.
    * Generate and email a custom Stripe Payment Link.
    * Move to *Prep* upon payment confirmation.
* **Catalog Management:** Add/edit products, adjust stock levels, toggle visibility for "sold out" drops.

## 6. Customer Workflows
* **Standard Purchase:** Landing Page -> Browse Category -> View PDP -> Add to Cart -> Proceed to Stripe Checkout -> Payment Success -> Confirmation Email.
* **Custom Commission:** Navigate to Custom Page -> Fill out detailed inquiry form (upload references) -> Receive Quote via Email -> Pay via Stripe Link -> Track custom fabrication progress.

## 7. Stripe Checkout Flow
1.  User clicks "Checkout" in the cart.
2.  Next.js API route securely creates a Stripe Checkout Session via the Stripe Node SDK.
3.  User is redirected to the Stripe-hosted, brand-styled checkout page.
4.  Upon successful payment, Stripe fires a `checkout.session.completed` webhook.
5.  Next.js webhook handler verifies the signature, inserts the `order` and `order_items` into the Neon database, and decrements `products` inventory.
6.  User is redirected to the `/success?session_id={id}` page.

## 8. Custom Order Request Flow
1.  User submits `/custom-request` form (validated client and server-side via Zod).
2.  Request is stored in the `custom_requests` table with status `Pending`.
3.  Admin receives an email notification (via Resend/SendGrid).
4.  Admin reviews the request in the dashboard, inputs a `quoted_price`, and clicks "Send Quote".
5.  System generates a Stripe Payment Link and emails it to the customer.
6.  When the Stripe Link is paid, a webhook updates the request status to `Paid` and creates a corresponding entry in the `orders` table to begin the *Prep* phase.

## 9. Product Page Requirements
* **Visuals:** Edge-to-edge or generously padded high-resolution image gallery.
* **Animations:** Subtle Framer Motion fade-ins and staggered text reveals. No bouncing or aggressive easing.
* **Typography:** Large, stark typography for the product title. Elegant, small monospaced fonts for SKU and metadata.
* **Interactivity:** Sticky "Add to Cart" button on mobile. Smooth accordion menus for "Materials", "Dimensions", and "Care Instructions".
* **Cross-sell:** "Complementary Pieces" section at the bottom.

## 10. Homepage Section Outline
1.  **Hero:** Full-bleed cinematic video or stark image of a hero product catching the light. Minimal text. One CTA: "Shop the Collection".
2.  **Manifesto/Intro:** A brief, high-impact statement about the craftsmanship and luxury of the items.
3.  **Featured Categories:** Asymmetric grid (using Tailwind 4 CSS Grid) showcasing Lighters, Beauty, and Cases.
4.  **Highlighted Product:** Split-screen layout. Left: extreme macro shot of rhinestones. Right: Product details and direct "Add to Cart" button.
5.  **Bespoke Callout:** Darker, moodier section inviting users to commission custom pieces.
6.  **Footer:** Ultra-minimal. Newsletter signup, essential links, copyright.

## 11. Design Rules
* **Colors:** Base is Almost Black (`#0a0a0a`) and Almost White (`#fafafa`). A single, interchangeable accent color (e.g., electric blue or sharp ruby) used sparingly for active states or subtle highlights.
* **Shapes:** Sharp corners. `rounded-none` or absolute minimum `rounded-sm`. No pill-shaped buttons.
* **Typography:** High-end sans-serif (e.g., Inter, Geist, or a premium foundry font). Tracked out uppercase for subheadings.
* **Spacing:** Extreme use of whitespace/negative space. Components should feel isolated and deliberate, not crowded.
* **Components:** Rely on shadcn/ui but heavily customize the theme variables to remove standard SaaS aesthetics (remove borders, rely on typography scale and background shifts).

## 12. QA Checklist
* [ ] Next.js build passes with zero type errors (TypeScript strict mode).
* [ ] Zod schemas perfectly match Drizzle schemas for inserts.
* [ ] Stripe webhooks successfully tested locally using Stripe CLI.
* [ ] Responsive design verified on mobile (Tailwind breakpoints).
* [ ] Framer Motion animations do not cause horizontal scrolling or layout shift.
* [ ] Neon Postgres connection pooling is configured correctly for serverless environments.
* [ ] Accessibility check: ARIA labels on icon buttons, contrast ratios met.

## 13. Launch Checklist
* [ ] Update Vercel environment variables (Production Neon DB, Live Stripe Keys).
* [ ] Run final Drizzle database migrations against production.
* [ ] Connect and verify custom domain.
* [ ] Toggle Stripe to Live Mode.
* [ ] Perform a real end-to-end test purchase using a live credit card (and refund it).
* [ ] Set up basic logging and Vercel Analytics.
* [ ] Clear all test data from the production database.
