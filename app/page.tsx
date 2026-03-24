import { Metadata } from "next"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturesSection } from "@/components/home/features-section"
import { CalculatorPreview } from "@/components/home/calculator-preview"
import { CTASection } from "@/components/home/cta-section"
import { Footer } from "@/components/home/footer"

export const metadata: Metadata = {
  title: "miqal / subnify",
  description:
    "Design and visualize subnet layouts in seconds with VLSM planning, overlap-safe allocation, and clear address space visibility.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <FeaturesSection />
        <CalculatorPreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
