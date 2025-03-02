"use client"

import { Container } from "@/components/ui/Container"
import { AlertsContent } from "@/components/dashboard/content/AlertsContent"

export default function AlertsPage() {
  return (
    <div className="py-6">
      <Container>
        <h1 className="text-2xl font-bold mb-6">Alerts</h1>
        <AlertsContent />
      </Container>
    </div>
  )
} 