"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, TrendingUp, GraduationCap, Users, Target, BookOpen } from "lucide-react"
import { ChatbotModal } from "./chatbot-modal"

export function ChatbotShowcase() {
  const [salesChatOpen, setSalesChatOpen] = useState(false)
  const [researchChatOpen, setResearchChatOpen] = useState(false)

  return (
    <>
      <section id="solutions" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">Dual AI Chatbots for Maximum Impact</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Purpose-built AI assistants that understand your business needs and customer requirements
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Internal Sales & Marketing Chatbot */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  Internal Tool
                </Badge>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Sales & Marketing AI</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Intelligent lead generation and upselling opportunities for your internal team
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Lead Identification</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically identify high-value prospects and upsell opportunities
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Customer Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        Deep analysis of customer behavior and purchasing patterns
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Smart Recommendations</h4>
                      <p className="text-sm text-muted-foreground">
                        AI-powered suggestions for cross-selling and account expansion
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => setSalesChatOpen(true)}
                  >
                    Launch Sales AI Assistant
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* External Customer Chatbot */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Customer Facing
                </Badge>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Research Assistant AI</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Helping universities and researchers discover the perfect publications
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <BookOpen className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Publication Discovery</h4>
                      <p className="text-sm text-muted-foreground">
                        Find relevant journals and publications based on research topics
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Smart Matching</h4>
                      <p className="text-sm text-muted-foreground">
                        AI-powered matching between research needs and available content
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Personalized Recommendations</h4>
                      <p className="text-sm text-muted-foreground">
                        Tailored suggestions based on institution and research focus
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setResearchChatOpen(true)}
                  >
                    Try Research Assistant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <ChatbotModal
        isOpen={salesChatOpen}
        onClose={() => setSalesChatOpen(false)}
        type="sales"
        title="Sales & Marketing AI Assistant"
        description="Intelligent lead generation and upselling opportunities"
      />

      <ChatbotModal
        isOpen={researchChatOpen}
        onClose={() => setResearchChatOpen(false)}
        type="research"
        title="Research Assistant AI"
        description="Helping you discover the perfect publications"
      />
    </>
  )
}
