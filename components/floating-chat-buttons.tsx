"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TrendingUp, GraduationCap } from "lucide-react"
import { ChatbotModal } from "./chatbot-modal"

export function FloatingChatButtons() {
  const [salesChatOpen, setSalesChatOpen] = useState(false)
  const [researchChatOpen, setResearchChatOpen] = useState(false)

  return (
    <>
      {/* Floating chat buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
        <Button
          onClick={() => setSalesChatOpen(true)}
          className="h-14 w-14 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          <TrendingUp className="h-6 w-6" />
        </Button>

        <Button
          onClick={() => setResearchChatOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          <GraduationCap className="h-6 w-6" />
        </Button>
      </div>

      {/* Chat modals */}
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
