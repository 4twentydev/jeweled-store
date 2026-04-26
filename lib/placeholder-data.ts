export type PlaceholderProduct = {
  id: string
  slug: string
  name: string
  category: string
  categoryLabel: string
  priceCents: number
  badge?: string
}

export type PlaceholderCategory = {
  slug: string
  label: string
  description: string
  gradient: string
  hoverGradient: string
}

export const PLACEHOLDER_PRODUCTS: PlaceholderProduct[] = [
  {
    id: "1",
    slug: "crystal-lighter-obsidian",
    name: "Crystal Lighter — Obsidian",
    category: "lighters",
    categoryLabel: "Lighters",
    priceCents: 24500,
    badge: "Limited",
  },
  {
    id: "2",
    slug: "crystal-lighter-gilded",
    name: "Crystal Lighter — Gilded",
    category: "lighters",
    categoryLabel: "Lighters",
    priceCents: 29500,
  },
  {
    id: "3",
    slug: "rhinestone-pillbox-onyx",
    name: "Rhinestone Pillbox — Onyx",
    category: "small-cases",
    categoryLabel: "Small Cases",
    priceCents: 18500,
    badge: "New",
  },
  {
    id: "4",
    slug: "bedazzled-compact-champagne",
    name: "Bedazzled Compact — Champagne",
    category: "beauty",
    categoryLabel: "Beauty",
    priceCents: 16500,
  },
  {
    id: "5",
    slug: "lighter-case-amethyst",
    name: "Lighter Case — Amethyst",
    category: "lighter-cases",
    categoryLabel: "Lighter Cases",
    priceCents: 12500,
  },
  {
    id: "6",
    slug: "lip-balm-crystal-rose",
    name: "Lip Balm — Crystal Rose",
    category: "beauty",
    categoryLabel: "Beauty",
    priceCents: 8900,
    badge: "Bestseller",
  },
]

export const PLACEHOLDER_CATEGORIES: PlaceholderCategory[] = [
  {
    slug: "bejeweled-lighters",
    label: "Lighters",
    description: "Fully bejeweled lighter bodies",
    gradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(212,175,55,0.11) 0%, transparent 65%)",
    hoverGradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(212,175,55,0.2) 0%, transparent 65%)",
  },
  {
    slug: "lighter-cases",
    label: "Lighter Cases",
    description: "Interchangeable rhinestone sleeves",
    gradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(200,162,200,0.11) 0%, transparent 65%)",
    hoverGradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(200,162,200,0.2) 0%, transparent 65%)",
  },
  {
    slug: "small-cases",
    label: "Small Cases",
    description: "Pillboxes, compacts, mirrors",
    gradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(125,249,255,0.07) 0%, transparent 65%)",
    hoverGradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(125,249,255,0.14) 0%, transparent 65%)",
  },
  {
    slug: "lip-balms",
    label: "Lip Balms",
    description: "Crystal-encrusted lip care",
    gradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(255,92,168,0.09) 0%, transparent 65%)",
    hoverGradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(255,92,168,0.18) 0%, transparent 65%)",
  },
  {
    slug: "lotions",
    label: "Lotions",
    description: "Shimmer-infused body care",
    gradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(255,92,168,0.09) 0%, transparent 65%)",
    hoverGradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(255,92,168,0.18) 0%, transparent 65%)",
  },
  {
    slug: "custom-rhinestone-items",
    label: "Custom",
    description: "Bespoke commissions",
    gradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(247,244,239,0.04) 0%, transparent 65%)",
    hoverGradient: "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(247,244,239,0.09) 0%, transparent 65%)",
  },
]
