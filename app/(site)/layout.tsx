import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartSheet } from "@/components/cart/cart-sheet"

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <CartSheet />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
