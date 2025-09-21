import { HeroSection } from "@/components/hero-section"
import { ChatbotShowcase } from "@/components/chatbot-showcase"
import { FeaturesSection } from "@/components/features-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { CTASection } from "@/components/cta-section"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FloatingChatButtons } from "@/components/floating-chat-buttons"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ChatbotShowcase />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
      <FloatingChatButtons />
    </div>
  )
}
