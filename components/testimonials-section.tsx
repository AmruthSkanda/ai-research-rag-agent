import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Research Director",
    institution: "Stanford University",
    avatar: "/professional-woman-researcher.png",
    content:
      "PublishAI has revolutionized how we discover and select publications. The AI recommendations are incredibly accurate and have saved us countless hours.",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Sales Manager",
    institution: "Academic Press International",
    avatar: "/professional-man-sales-manager.jpg",
    content:
      "Our revenue has increased by 35% since implementing the sales AI chatbot. The lead generation capabilities are phenomenal.",
    rating: 5,
  },
  {
    name: "Prof. Emily Watson",
    role: "Department Head",
    institution: "MIT Libraries",
    avatar: "/professional-woman-professor.png",
    content:
      "The research assistant AI understands our specific needs and consistently provides relevant publication recommendations.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">Trusted by Leading Institutions</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            See what our customers are saying about their experience with PublishAI
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                <blockquote className="text-sm leading-relaxed mb-6 text-muted-foreground">
                  "{testimonial.content}"
                </blockquote>

                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.institution}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
