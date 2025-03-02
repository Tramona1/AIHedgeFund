"use client"

import { Container } from "@/components/ui/Container"
import { OptionsFlowContent } from "@/components/dashboard/content/OptionsFlowContent"

export default function OptionsPage() {
  return (
    <div className="py-6">
      <Container>
        <h1 className="text-2xl font-bold mb-6">Options Flow</h1>
        <OptionsFlowContent />
      </Container>
    </div>
  )
} 