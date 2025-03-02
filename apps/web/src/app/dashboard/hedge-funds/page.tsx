"use client"

import { Container } from "@/components/ui/Container"
import { HedgeFundContent } from "@/components/dashboard/content/HedgeFundContent"

export default function HedgeFundsPage() {
  return (
    <div className="py-6">
      <Container>
        <h1 className="text-2xl font-bold mb-6">Hedge Fund Activity</h1>
        <HedgeFundContent />
      </Container>
    </div>
  )
} 