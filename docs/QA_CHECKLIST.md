# Jeweled Store Pre-Launch QA Checklist

### 1. Visual QA (Minimalist Luxury Aesthetic)
- [ ] **Brand Consistency:** Verify "Almost Black" (`#0a0a0a`) and "Almost White" (`#fafafa`) contrast throughout.
- [ ] **Typography:** Check that Geist/Inter fonts are loading; verify tracked-out uppercase subheadings.
- [ ] **Sharp Design:** Ensure all buttons and cards have `rounded-none` or `rounded-sm` (no pill shapes).
- [ ] **Animations:** Verify Framer Motion fade-ins are subtle and don't cause layout shifts (CLS).
- [ ] **Whitespace:** Audit padding on all sections to ensure the "editorial" feel is maintained.
- [ ] **Placeholders:** Ensure no default `next.svg` or placeholder images remain in production.

### 2. Mobile QA
- [ ] **Responsive Layouts:** Test asymmetric grids on iPhone and Android browsers.
- [ ] **Sticky Actions:** Confirm the "Add to Cart" button sticks to the bottom on Product Detail Pages (PDP).
- [ ] **Mobile Nav:** Ensure the mobile menu trigger and overlay work smoothly without scroll locking issues.
- [ ] **Touch Targets:** Verify all interactive elements have at least 44x44px hit areas.

### 3. Product Catalog QA
- [ ] **Gallery Performance:** High-res images should load with blur-up placeholders; no broken images.
- [ ] **Product Metadata:** Verify monospaced SKU and material details are visible on the PDP.
- [ ] **Accordion Menus:** Test "Care Instructions" and "Dimensions" dropdowns for smooth transitions.
- [ ] **Active States:** Verify the "Sold Out" state triggers correctly when `stock` is 0 in the database.
- [ ] **Custom Commissions:** Test the custom order inquiry form (Zod validation + image upload).

### 4. Cart QA
- [ ] **Persistence:** Verify cart items persist across page refreshes (Local Storage/Cookie).
- [ ] **Syncing:** Ensure "Quick Add" from the collection page updates the Cart Sheet immediately.
- [ ] **Quantity Logic:** Prevent users from adding more items than available in `stock`.
- [ ] **Empty State:** Verify the cart displays a graceful empty state with a "Shop Collection" link.

### 5. Stripe Checkout QA
- [ ] **Session Creation:** Confirm clicking "Checkout" creates a session with correct `priceCents`.
- [ ] **Metadata:** Verify `items` (product IDs and quantities) are passed correctly in Stripe metadata.
- [ ] **Hosted UI:** Ensure the Stripe checkout page is branded with the Jeweled Store logo and colors.
- [ ] **Cancel Flow:** Test redirecting back to the cart if a user cancels the Stripe session.

### 6. Stripe Webhook QA
- [ ] **Signature Verification:** Confirm the webhook rejects requests with invalid signatures.
- [ ] **Order Creation:** Verify `orders` and `order_items` are inserted into the DB upon `checkout.session.completed`.
- [ ] **Inventory Sync:** Confirm `products.stock` decrements correctly after a successful purchase.
- [ ] **Idempotency:** Ensure the webhook handles duplicate events without creating duplicate orders.
- [ ] **Success Redirect:** Test the `/success?session_id=...` page displays correct order details.

### 7. Admin QA
- [ ] **Auth Gate:** Ensure `/admin` routes are inaccessible to non-admin users.
- [ ] **Workflow States:** Verify orders can transition through `New` -> `Prep` -> `Assembly` -> `Shipping`.
- [ ] **Custom Quotes:** Test the "Send Quote" flow: generate payment link -> email customer.
- [ ] **Catalog Management:** Verify admins can toggle `active` status and update prices.

### 8. Database QA
- [ ] **Migrations:** Confirm `drizzle-kit push` has been run against the Production Neon DB.
- [ ] **Indexing:** Verify indexes on `products.slug` and `orders.customer_email` are active.
- [ ] **Relationship Integrity:** Ensure `onDelete: "cascade"` works correctly for order items.

### 9. Vercel Deployment QA
- [ ] **Env Vars:** Verify `DATABASE_URL`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` are set for Production.
- [ ] **Build Check:** Ensure `bun run build` completes with zero TypeScript or Lint errors.
- [ ] **Edge Runtime:** Verify any API routes using Edge runtime are functioning as expected.

### 10. SEO QA
- [ ] **Metadata API:** Verify each PDP has unique `title` and `description` tags (Next.js Metadata).
- [ ] **OpenGraph:** Test social share previews for products (image, price, and description).
- [ ] **Canonical Tags:** Ensure no duplicate content issues across `/products` and `/category/*`.
- [ ] **Sitemap:** Verify `sitemap.xml` includes all active product slugs.

### 11. Accessibility QA (A11y)
- [ ] **Contrast Ratios:** Ensure text on "Almost Black" backgrounds meets WCAG AA standards.
- [ ] **Screen Readers:** Verify ARIA labels on the Cart Sheet trigger and "Quick Add" buttons.
- [ ] **Keyboard Nav:** Ensure all buttons and links are focusable and have a visible focus ring.

### 12. Performance QA
- [ ] **Lighthouse:** Score 90+ on Performance, Accessibility, and Best Practices.
- [ ] **Core Web Vitals:** Check Largest Contentful Paint (LCP) for the hero image.
- [ ] **Image Optimization:** Verify `next/image` is used for all product photography.

### 13. Security QA
- [ ] **Data Sanitization:** Verify Zod schemas are used for all server actions and API routes.
- [ ] **Stripe Keys:** Confirm **Secret Keys** are never exposed in client-side code (`process.env.NEXT_PUBLIC_...`).
- [ ] **Rate Limiting:** (Optional/Recommended) Ensure basic rate limiting on the `/api/checkout` and `/custom-request` endpoints.
