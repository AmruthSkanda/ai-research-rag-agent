import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, BarChart3, Shield, Zap, Globe, Users2, Database, MessageCircle } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Advanced AI Analytics",
    description: "Machine learning algorithms that understand publishing patterns and customer behavior",
  },
  {
    icon: BarChart3,
    title: "Revenue Optimization",
    description: "Identify upselling opportunities and maximize revenue per customer relationship",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with SOC 2 compliance and data encryption at rest and in transit",
  },
  {
    icon: Zap,
    title: "Real-time Insights",
    description: "Instant analysis and recommendations powered by cutting-edge AI technology",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Support for multiple languages and international publishing standards",
  },
  {
    icon: Users2,
    title: "Team Collaboration",
    description: "Seamless integration with your existing sales and marketing workflows",
  },
  {
    icon: Database,
    title: "Data Integration",
    description: "Connect with your existing CRM, publishing systems, and analytics platforms",
  },
  {
    icon: MessageCircle,
    title: "24/7 AI Support",
    description: "Round-the-clock intelligent assistance for both internal teams and customers",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">Powerful Features for Modern Publishing</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Everything you need to transform your publishing business with AI-driven intelligence
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
