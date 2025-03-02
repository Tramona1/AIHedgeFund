"use client"

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Shield, Zap, Eye, LineChartIcon as ChartLineUp, Building2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export function PricingSection() {
  return (
    <div className="grid gap-8 md:grid-cols-4">
      <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
        <Card className="relative h-full border-primary">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
            Start Free
          </div>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="mt-4 text-4xl font-bold">$0/mo</div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Track 3 assets
              </li>
              <li className="flex items-center gap-2">
                <ChartLineUp className="h-4 w-4 text-primary" /> Weekly summaries
              </li>
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Basic AI insights
              </li>
            </ul>
            <Link href="/signup">
              <Button className="mt-8 w-full">Get Started</Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
        <Card className="relative h-full">
          <CardHeader>
            <CardTitle>Basic</CardTitle>
            <CardDescription>For active investors</CardDescription>
            <div className="mt-4 text-4xl font-bold">$29/mo</div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Track 10 assets
              </li>
              <li className="flex items-center gap-2">
                <ChartLineUp className="h-4 w-4 text-primary" /> Real-time alerts
              </li>
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Advanced AI insights
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Basic technical signals
              </li>
            </ul>
            <Link href="/signup">
              <Button className="mt-8 w-full">Get Started</Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
        <Card className="relative h-full">
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>For serious traders</CardDescription>
            <div className="mt-4 text-4xl font-bold">$79/mo</div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Unlimited tracking
              </li>
              <li className="flex items-center gap-2">
                <ChartLineUp className="h-4 w-4 text-primary" /> Dark pool insights
              </li>
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Options flow
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Advanced signals
              </li>
            </ul>
            <Link href="/signup">
              <Button className="mt-8 w-full">Get Started</Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
        <Card className="relative h-full">
          <CardHeader>
            <CardTitle>Enterprise</CardTitle>
            <CardDescription>Custom solutions</CardDescription>
            <div className="mt-4 text-4xl font-bold">Contact Us</div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4">
              <li className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Custom integration
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Dedicated support
              </li>
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Custom AI models
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> API access
              </li>
            </ul>
            <Link href="/contact">
              <Button className="mt-8 w-full">Contact Sales</Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 