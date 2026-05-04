# Codex Input Kit — JWLD Containers Batch 01

This kit contains 7 JWLD round container/accessory products ready to import into the app.

## Files
- `jwld-containers-batch01.json` — primary structured import file
- `jwld-containers-batch01.ts` — TypeScript export for direct app integration
- `jwld-containers-batch01.csv` — spreadsheet-friendly import sheet
- `product-descriptions.md` — formatted copy blocks
- `images/` — optimized 1200x1200 WebP product images
- `images/thumbs/` — 400x400 WebP thumbnails
- `images/source/` — original source images
- `contact-sheet.jpg` — quick visual reference

## Recommended import flow
1. Copy `images/` into the app's product asset folder.
2. Import `jwld-containers-batch01.ts` or `jwld-containers-batch01.json`.
3. Use `sku` as the unique product key.
4. Use `slug` for product routes.
5. Use `image` for product detail pages and `thumbnail` for product cards.
6. Use `shortDescription` for cards and `description` + `bulletPoints` for the product detail page.
7. Map `category` to `containers`.
8. Map `collection` to `jwld-containers-batch-01`.

## Example TypeScript mapping
```ts
import { jwldContainersBatch01 } from "./jwld-containers-batch01";

export const products = jwldContainersBatch01.map((item) => ({
  sku: item.sku,
  slug: item.slug,
  name: item.name,
  category: item.category,
  collection: item.collection,
  priceCents: item.priceCents,
  currency: item.currency,
  inventory: item.inventory,
  status: item.status,
  featured: item.featured,
  images: [
    { src: item.image, alt: item.alt, type: "primary" },
    { src: item.thumbnail, alt: item.alt, type: "thumbnail" },
  ],
  description: item.description,
  shortDescription: item.shortDescription,
  bulletPoints: item.bulletPoints,
  tags: item.tags,
  colors: item.colors,
  materials: item.materials,
  seo: {
    title: item.seoTitle,
    description: item.seoDescription,
  },
}));
```

## Notes
- Prices are placeholders and can be adjusted.
- Inventory defaults to `5`.
- All products are marked `active`.
