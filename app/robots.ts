import type { MetadataRoute } from "next"

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://jwld.store"
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/cart", "/checkout", "/success"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
