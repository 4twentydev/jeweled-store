# Codex Prompt — Add JWLD Products Batch 03

You are working in the JWLD e-commerce app. Add the product batch in this package to the app.

## Files in this package

- `data/jwld-products-batch03.ts` — TypeScript product array with typed product objects.
- `data/jwld-products-batch03.json` — Same product data in JSON.
- `data/jwld-products-batch03.csv` — Flat catalog export for import/review.
- `public/products/*.webp` — 1200x1200 optimized product images.
- `public/products/*-thumb.webp` — 400x400 thumbnails.
- `docs/product-descriptions-batch03.md` — Copywriting reference.

## Implementation task

1. Copy every file in `public/products/` into the app's `public/products/` directory.
2. Import `jwldProductsBatch03` from `data/jwld-products-batch03.ts` into the app's product data source.
3. Merge the batch into the existing product catalog without deleting existing products.
4. Preserve each product's `slug`, `sku`, `priceCents`, `images`, `thumbnail`, `tags`, `features`, `seoTitle`, and `seoDescription`.
5. If the app has a different product schema, map fields carefully:
   - `name` → product title/name
   - `slug` → route slug
   - `priceCents` → price in cents
   - `images[0].src` → main product image
   - `thumbnail` → card image/thumb
   - `shortDescription` → card/subtitle copy
   - `description` → product detail copy
   - `features` → bullet list
   - `details.mainColor`, `details.accentColors`, `details.finish`, `details.style` → product specs/details
   - `tags` and `collection` → filters/collections
6. Make sure product image paths resolve from the public directory, for example `/products/jwld-santa-suit-crystal-lighter-01.webp`.
7. Add or update product listing UI only if needed to display these fields cleanly.
8. Run lint/typecheck/build and fix any schema, import, or image path issues.

## Expected outcome

The app should show 10 new JWLD products with working product images, descriptions, prices, slugs, and product detail pages.
