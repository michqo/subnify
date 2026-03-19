import { HeroSection } from "@/components/home/hero-section"
import { FeaturesSection } from "@/components/home/features-section"
import { CalculatorPreview } from "@/components/home/calculator-preview"
import { VisualizerPreview } from "@/components/home/visualizer-preview"
import { CTASection } from "@/components/home/cta-section"
import { Footer } from "@/components/home/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <FeaturesSection />
        <CalculatorPreview />
        <VisualizerPreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
