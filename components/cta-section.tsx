import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">
            Ready to Transform Your Publishing Business?
          </h2>
          <p className="text-xl text-muted-foreground text-pretty mb-8">
            Join hundreds of publishers and research institutions already using AI to drive growth and improve customer
            experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Demo
            </Button>
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Setup in under 5 minutes
          </div>
        </div>
      </div>
    </section>
  )
}
