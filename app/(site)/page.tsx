import { Hero } from "@/components/sections/hero"
import { Manifesto } from "@/components/sections/manifesto"
import { FeaturedProducts } from "@/components/sections/featured-products"
import { CategoryStrip } from "@/components/sections/category-strip"
import { CustomOrderCta } from "@/components/sections/custom-order-cta"

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <FeaturedProducts />
      <CategoryStrip />
      <CustomOrderCta />
    </>
  )
}
