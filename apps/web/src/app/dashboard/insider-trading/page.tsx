"use client"

import { Container } from "@/components/ui/Container"
import { InsiderTradingContent } from "@/components/dashboard/content/InsiderTradingContent"

export default function InsiderTradingPage() {
  return (
    <div className="py-6">
      <Container>
        <h1 className="text-2xl font-bold mb-6">Insider Trading</h1>
        <InsiderTradingContent />
      </Container>
    </div>
  )
} 