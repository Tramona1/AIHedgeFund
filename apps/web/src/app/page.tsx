"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Bell, Briefcase, LineChartIcon as ChartLineUp, Clock, Eye, Shield, Zap } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { Badge } from "@/components/ui/Badge"
import { FAQ } from "@/components/FAQ"
import { InterestForm } from "@/components/InterestForm"

// Animated ticker tape component
function MarketTicker() {
  const tickers = [
    { symbol: "AAPL", change: "+1.2%", color: "text-green-500" },
    { symbol: "GOOGL", change: "+0.8%", color: "text-green-500" },
    { symbol: "MSFT", change: "+1.5%", color: "text-green-500" },
    { symbol: "TSLA", change: "-0.6%", color: "text-red-500" },
    { symbol: "META", change: "+2.1%", color: "text-green-500" },
    { symbol: "NVDA", change: "+3.2%", color: "text-green-500" },
    { symbol: "AMZN", change: "+0.9%", color: "text-green-500" },
    { symbol: "JPM", change: "-0.4%", color: "text-red-500" },
  ]

  return (
    <div className="bg-gradient-to-r from-blue-50 to-white py-3 overflow-hidden border-b border-blue-100">
      <div className="flex items-center animate-[marquee_30s_linear_infinite] whitespace-nowrap">
        {tickers.concat(tickers).map((ticker, i) => (
          <div key={i} className="flex items-center mx-6">
            <span className="font-semibold text-blue-900">{ticker.symbol}</span>
            <span className={`ml-2 ${ticker.color}`}>{ticker.change}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Alert ticker component
function AlertTicker() {
  const alerts = [
    {
      symbol: "NVDA",
      content: "Renaissance Technologies increases position by 215%",
      source: "SEC Filing 13F",
      type: "Hedge Fund Activity",
    },
    {
      symbol: "JPM",
      content: "Jamie Dimon sells 33% of holdings ($58M)",
      source: "SEC Form 4",
      type: "Insider Trading",
    },
    {
      symbol: "TSLA",
      content: "Blackrock decreases position by 8.3%",
      source: "13F Filing",
      type: "Institutional Activity",
    },
  ]

  return (
    <div className="bg-gradient-to-r from-white to-blue-50 py-3 overflow-hidden border-b border-blue-100">
      <div className="flex items-center animate-[marquee_40s_linear_infinite] whitespace-nowrap">
        {alerts.concat(alerts).map((alert, i) => (
          <div key={i} className="flex items-center mx-8">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 mr-2">
              {alert.type}
            </Badge>
            <span className="font-semibold text-blue-900">${alert.symbol}:</span>
            <span className="ml-2 text-blue-700">{alert.content}</span>
            <span className="ml-2 text-sm text-blue-500">via {alert.source}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple feature card component
function SimpleFeatureCard({
  icon,
  title,
  tagline,
  description,
}: {
  icon: React.ReactNode
  title: string
  tagline: string
  description: string
}) {
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
        <CardContent>
          <CardDescription className="text-base text-blue-700/70">{description}</CardDescription>
          <div className="mt-6">
            <Link href="/signup">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Updated alert card with modern styling
function AlertCard({
  ticker,
  content,
  author = null,
  type,
}: { ticker: string; content: string; author?: string | null; type: string }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border-blue-100">
      <CardHeader className="pb-3 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 flex items-center justify-center bg-blue-100 rounded-full">
            <span className="font-bold text-blue-700">${ticker}</span>
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
            {type}
          </Badge>
        </div>
        {author && <div className="text-xs text-muted-foreground">via {author}</div>}
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-foreground/90">{content}</p>
      </CardContent>
    </Card>
  )
}

const animationStyles = `
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 4s ease infinite;
  }
`

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Ensure hydration is complete
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real application, you would send this to your API
    console.log("Newsletter subscription submitted for:", email)
    // Show success message
    setIsSubscribed(true)
    // Reset form
    setEmail("")
    // Reset success message after 3 seconds
    setTimeout(() => {
      setIsSubscribed(false)
    }, 3000)
  }

  // Return simplified content for first paint
  if (!mounted) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-20">
          <h1 className="text-4xl font-bold">AI Hedge Fund</h1>
          <p className="mt-4 text-xl">Institutional intelligence for retail investors.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Ticker Tape */}
      <>
        <MarketTicker />
        <AlertTicker />
      </>

      {/* Hero Section */}
      <Section variant="grid" className="overflow-hidden">
        <Container className="py-20 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center space-y-6"
            >
              <Badge variant="secondary" className="w-fit">
                Stay Informed About What You Own—For Free
              </Badge>

              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-5xl lg:text-6xl">
                Get the
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent animate-gradient">
                  {" "}
                  Same Insights
                </span>{" "}
                as Hedge Funds
              </h1>

              <p className="text-muted-foreground text-lg md:text-xl">
                Own a stock, some crypto, or even real estate? Sign up for our free tier and stay in the know. Big banks
                and hedge funds have long had the upper hand with elite insights—until now. We're leveling the playing
                field.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View Demo
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute animate-pulse bg-blue-500/20 rounded-full w-64 h-64 blur-3xl"></div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              >
                <InterestForm />
              </motion.div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Features Section */}
      <Section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-900">
              Your Edge in the Market
            </h2>
            <p className="mt-4 text-xl text-blue-700/80 max-w-2xl mx-auto">
              Our AI digs into market data, SEC filings, and more to bring you institutional-grade insights—fast. Click
              'Learn More' to see how each feature works.
            </p>
          </motion.div>

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <SimpleFeatureCard
              icon={<ChartLineUp className="h-8 w-8 text-blue-600" />}
              title="Real-time Analysis"
              tagline="Track hedge fund moves, insider trades, and market sentiment as it happens."
              description="Our AI scans SEC filings, verified X posts from market influencers, and live data to flag big moves—like a hedge fund doubling its stake—that could affect your assets."
            />
            <SimpleFeatureCard
              icon={<Bell className="h-8 w-8 text-blue-600" />}
              title="Personalized Alerts"
              tagline="Get instant notifications tailored to what you own or watch."
              description="Set it up your way: 'Alert me if TSLA drops 5%' or 'Notify me of insider sales in VNQ.' You'll know the second something big happens."
            />
            <SimpleFeatureCard
              icon={<Eye className="h-8 w-8 text-blue-600" />}
              title="Dark Pool Insights"
              tagline="Spot hidden institutional trades before they hit the market."
              description="See large trades—like $1M+ in dark pools—that signal where the big money's heading."
            />
            <SimpleFeatureCard
              icon={<Zap className="h-8 w-8 text-blue-600" />}
              title="Option Flow Analysis"
              tagline="Catch bullish or bearish trends in options activity."
              description="We track hefty options trades (e.g., $100K+ premiums) to clue you in on potential price swings."
            />
            <SimpleFeatureCard
              icon={<Shield className="h-8 w-8 text-blue-600" />}
              title="Lightning Fast"
              tagline="Alerts hit your inbox or phone within seconds."
              description="No delays—our system processes events in real-time so you're never behind."
            />
            <SimpleFeatureCard
              icon={<Clock className="h-8 w-8 text-blue-600" />}
              title="Weekly Summaries"
              tagline="A Monday recap of what moved your markets."
              description="Get a digest of last week's key activity—insider trades, hedge fund shifts, and more—tailored to your picks."
            />
          </div>
        </Container>
      </Section>

      {/* Testimonials Section */}
      <Section className="py-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-blue-900">
              Trusted by Traders & Investors
            </h2>
            <p className="mt-4 text-xl text-blue-700/80 max-w-2xl mx-auto">
              Join thousands of investors who rely on our platform for market insights
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div 
              whileInView={{ scale: [0.9, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center p-6"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-lg text-blue-900">Active Users</div>
            </motion.div>
            <motion.div 
              whileInView={{ scale: [0.9, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center p-6"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-lg text-blue-900">Customer Satisfaction</div>
            </motion.div>
            <motion.div 
              whileInView={{ scale: [0.9, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">8,500+</div>
              <div className="text-lg text-blue-900">Stocks Covered</div>
            </motion.div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileInView={{ y: [20, 0], opacity: [0, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-blue-50 p-6 rounded-lg border border-blue-100"
            >
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                </svg>
              </div>
              <p className="text-blue-900 mb-6">
                "This platform gave me insights I couldn't get anywhere else. I was able to spot institutional movements before they affected my positions."
              </p>
              <div className="mt-auto">
                <div className="flex items-center">
                  <div className="bg-blue-200 text-blue-700 font-bold rounded-full w-10 h-10 flex items-center justify-center mr-3">SJ</div>
                  <div>
                    <div className="font-semibold text-blue-900">Sarah Johnson</div>
                    <div className="text-sm text-blue-700">Day Trader</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileInView={{ y: [20, 0], opacity: [0, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-blue-50 p-6 rounded-lg border border-blue-100"
            >
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                </svg>
              </div>
              <p className="text-blue-900 mb-6">
                "The hedge fund activity alerts have completely changed how I approach my investment strategy. Worth every penny."
              </p>
              <div className="mt-auto">
                <div className="flex items-center">
                  <div className="bg-blue-200 text-blue-700 font-bold rounded-full w-10 h-10 flex items-center justify-center mr-3">MC</div>
                  <div>
                    <div className="font-semibold text-blue-900">Michael Chen</div>
                    <div className="text-sm text-blue-700">Portfolio Manager</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileInView={{ y: [20, 0], opacity: [0, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-blue-50 p-6 rounded-lg border border-blue-100"
            >
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                </svg>
              </div>
              <p className="text-blue-900 mb-6">
                "I've tried many services, but none offer the combination of speed and accuracy that this platform delivers."
              </p>
              <div className="mt-auto">
                <div className="flex items-center">
                  <div className="bg-blue-200 text-blue-700 font-bold rounded-full w-10 h-10 flex items-center justify-center mr-3">RK</div>
                  <div>
                    <div className="font-semibold text-blue-900">Robert Kiyota</div>
                    <div className="text-sm text-blue-700">Retail Investor</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Sample Updates Section */}
      <Section>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">See It In Action</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Examples of the real-time intelligence you'll receive
              </p>
            </div>

            <Tabs defaultValue="alerts" className="mx-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="alerts">Real-time Alerts</TabsTrigger>
                <TabsTrigger value="flows">Option Flows</TabsTrigger>
                <TabsTrigger value="technical">Technical Signals</TabsTrigger>
              </TabsList>
              <TabsContent value="alerts" className="mt-6">
                <div className="space-y-4">
                  <AlertCard
                    ticker="JPM"
                    content="Jamie Dimon has sold 33% of his JPM holdings worth approximately $58M"
                    type="Insider Trading"
                    author="SEC Form 4"
                  />
                  <AlertCard
                    ticker="NVDA"
                    content="Bridgewater Associates increases position in NVDA by 150%, now holding 2.3M shares"
                    type="Hedge Fund Activity"
                    author="13F Filing"
                  />
                  <AlertCard
                    ticker="TSLA"
                    content="Blackrock decreases position in TSLA by 8.3%, selling approximately 4.2M shares"
                    type="Institutional Activity"
                    author="13F Filing"
                  />
                </div>
              </TabsContent>
              <TabsContent value="flows" className="mt-6">
                <div className="space-y-4">
                  <AlertCard
                    ticker="AAPL"
                    content="Unusual call buying detected - $2.5M in Jun 24 $210 calls purchased at ask"
                    type="Large Option Flow"
                    author="Options Scanner"
                  />
                  <AlertCard
                    ticker="AMD"
                    content="Large block trade - 1.2M shares at $145.80 (1.8% above market)"
                    type="Dark Pool Activity"
                    author="Flow Tracker"
                  />
                  <AlertCard
                    ticker="SPY"
                    content="$SPY June 500 Calls - $4.2M in premium (86% above ask price)"
                    type="Options Sweep"
                    author="Options Scanner"
                  />
                </div>
              </TabsContent>
              <TabsContent value="technical" className="mt-6">
                <div className="space-y-4">
                  <AlertCard
                    ticker="TSLA"
                    content="RSI indicating oversold conditions on 4H timeframe with positive divergence forming"
                    type="Technical Signal"
                    author="Technical Analysis"
                  />
                  <AlertCard
                    ticker="MSFT"
                    content="Breaking out of 3-month consolidation pattern on high volume (+42% above average)"
                    type="Breakout Alert"
                    author="Pattern Recognition"
                  />
                  <AlertCard
                    ticker="META"
                    content="Testing critical support at 200-day moving average with increased put/call ratio"
                    type="Support Test"
                    author="Technical Analysis"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </Container>
      </Section>

      {/* Pricing Section */}
      <Section variant="muted">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your trading style
            </p>
          </motion.div>

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
                      <Clock className="h-4 w-4 text-primary" /> Weekly summaries
                    </li>
                    <li className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" /> Basic AI insights
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button className="mt-8 w-full">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="md:col-span-2">
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
                      <Clock className="h-4 w-4 text-primary" /> Real-time alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" /> Advanced AI insights
                    </li>
                    <li className="flex items-center gap-2">
                      <ChartLineUp className="h-4 w-4 text-primary" /> Basic technical signals
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
                      <Zap className="h-4 w-4 text-primary" /> Unlimited tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" /> Dark pool insights
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" /> Options flow
                    </li>
                    <li className="flex items-center gap-2">
                      <ChartLineUp className="h-4 w-4 text-primary" /> Advanced signals
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button className="mt-8 w-full">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section variant="primary">
        <Container className="py-16">
          <div className="flex flex-col items-center text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tighter sm:text-4xl"
            >
              Ready to Level the Playing Field?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-lg max-w-2xl"
            >
              Join thousands of investors who are using AI Hedge Fund to stay ahead of the market.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/signup">
                <Button size="lg" className="mt-8 bg-white text-primary hover:bg-white/90">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Newsletter Section */}
      <Section>
        <Container className="py-16">
          <Card className="overflow-hidden border-neutral-200/50 dark:border-neutral-800/50">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
                <p className="text-muted-foreground mb-4">
                  Subscribe to our newsletter to receive the latest market insights and product updates.
                </p>
                {isSubscribed ? (
                  <div className="bg-green-50 text-green-700 p-3 rounded-md border border-green-200 mb-2">
                    Thanks for subscribing! You'll receive our next newsletter.
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                        className="w-full rounded-md px-3 py-2 border border-input bg-background h-10"
                        required
                      />
                    </div>
                    <Button type="submit">Subscribe</Button>
                  </form>
                )}
              </div>
              <div className="bg-primary/5 flex items-center justify-center p-6 md:p-8">
                <div className="text-center">
                  <h4 className="font-bold mb-1">Weekly Market Updates</h4>
                  <p className="text-sm text-muted-foreground">Analyst insights, hedge fund movements, and more</p>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section variant="muted">
        <Container className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our service
            </p>
          </div>
          <FAQ />
        </Container>
      </Section>
    </div>
  )
} 