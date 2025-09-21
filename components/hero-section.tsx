import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background py-20 lg:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.1)_50%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium mb-6">
            <Sparkles className="mr-2 h-4 w-4 text-accent" />
            AI-Powered Publishing Platform
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-6">
            Empowering Academic <span className="text-primary">Publishing</span> with AI-Driven Insights
          </h1>

          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto mb-8">
            Transform your publishing workflow with intelligent chatbots that generate leads, identify upsell
            opportunities, and help researchers discover the perfect publications.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8">
              See AI in Action
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
              Schedule Demo
            </Button>
          </div>

          <div className="mt-12 text-sm text-muted-foreground">
            Trusted by 500+ universities and research institutions worldwide
          </div>
        </div>
      </div>
    </section>
  )
}
