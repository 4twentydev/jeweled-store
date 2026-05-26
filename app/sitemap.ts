import type { MetadataRoute } from "next"
import { getProducts } from "@/db/queries/products"

export const dynamic = "force-dynamic"

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://jwld.store"
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()
  const now = new Date()
  const publicRoutes = ["", "/products", "/custom", "/about", "/contact", "/privacy", "/terms"]

  const staticEntries = publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/products" ? ("daily" as const) : ("monthly" as const),
    priority: route === "" ? 1 : route === "/products" ? 0.9 : 0.5,
  }))

  const productEntries = (await getProducts()).map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: product.createdAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
    images: product.images,
  }))

  return [...staticEntries, ...productEntries]
}
