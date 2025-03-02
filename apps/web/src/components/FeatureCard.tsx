"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import Link from "next/link"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  tagline: string
  description: string
}

export function FeatureCard({ icon, title, tagline, description }: FeatureCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className="h-full transition-all hover:shadow-md border-blue-100 overflow-hidden group">
        <CardHeader className="pb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {icon}
          </div>
          <CardTitle className="text-xl text-blue-900">{title}</CardTitle>
          <CardDescription className="text-base text-blue-700/70">{tagline}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-between hover:bg-blue-50"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Learn More
            {isExpanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 pb-4 text-sm text-muted-foreground">{description}</div>
                <Link href="/signup">
                  <Button variant="outline" size="sm" className="w-full mt-2 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors">
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
} 