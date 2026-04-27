import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "jwld",
    template: "%s — jwld",
  },
  description:
    "Luxury bejeweled accessories. Hand-applied rhinestone and precious-metal finishes on lighters, cases, and beauty objects.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://jwld.store"),
  openGraph: {
    siteName: "jwld",
    locale: "en_US",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Accent colour set before paint — no flash */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var a=["#C8A2C8","#D4AF37","#FF5CA8","#7DF9FF","#B6FF7D"];document.documentElement.style.setProperty("--jwld-accent",a[Math.floor(Math.random()*a.length)])})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
