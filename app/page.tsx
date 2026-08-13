import { Metadata } from "next"
import { HeroSection } from "@/components/home/hero-section"
import { ProductProof } from "@/components/home/product-proof"
import { CTASection } from "@/components/home/cta-section"
import { Footer } from "@/components/home/footer"

export const metadata: Metadata = {
  title: "miqal / subnify",
  description:
    "Plan IPv4 subnets with VLSM, live capacity checks, saved history, and export.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <ProductProof />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
