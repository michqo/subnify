import { Metadata } from "next"
import { HeroSection } from "@/components/home/hero-section"
import { ProductProof } from "@/components/home/product-proof"
import { CTASection } from "@/components/home/cta-section"
import { Footer } from "@/components/home/footer"

export const metadata: Metadata = {
  title: "miqal / subnify",
  description:
    "Design and visualize subnet layouts in seconds with VLSM planning, overlap-safe allocation, and clear address space visibility.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen font-mono">
      <main>
        <HeroSection />
        <ProductProof />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
