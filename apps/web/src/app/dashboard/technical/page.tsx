"use client"

import { Container } from "@/components/ui/Container"
import { TechnicalContent } from "@/components/dashboard/content/TechnicalContent"

export default function TechnicalPage() {
  return (
    <div className="py-6">
      <Container>
        <h1 className="text-2xl font-bold mb-6">Technical Analysis</h1>
        <TechnicalContent />
      </Container>
    </div>
  )
} 