"use client"

import * as React from "react"
import { ArrowRight, Bell, Briefcase, BarChart as ChartLineUp, Clock, Eye, Shield, Zap } from 'lucide-react'
import { motion } from "framer-motion"
import Link from "next/link"

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/skeleton"

// Animated ticker tape component
const TickerTape = () => {
  const tickers = [
    { symbol: "AAPL", change: "+1.2%", color: "text-green-500" },
    { symbol: "GOOGL", change: "+0.8%", color: "text-green-500" },
    { symbol: "MSFT", change: "+1.5%", color: "text-green-500" },
    { symbol: "TSLA", change: "-0.6%", color: "text-red-500" },
    { symbol: "META", change: "+2.1%", color: "text-green-500" },
    { symbol: "NVDA", change: "+3.2%", color: "text-green-500" },
    { symbol: "AMZN", change: "+0.9%", color: "text-green-500" },
    { symbol: "JPM", change: "-0.4%", color: "text-red-500" },
  ];

  return (
    <div className="bg-muted/20 py-2 overflow-hidden border-b">
      <div className="flex items-center animate-[marquee_30s_linear_infinite] whitespace-nowrap">
        {tickers.concat(tickers).map((ticker, i) => (
          <div key={i} className="flex items-center mx-6">
            <span className="font-semibold">{ticker.symbol}</span>
            <span className={`ml-2 ${ticker.color}`}>{ticker.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Updated alert card with modern styling
const AlertCard = ({ ticker, content, author = null, type }: { ticker: string; content: string; author?: string | null; type: string }) => (
  <Card className="overflow-hidden transition-all hover:shadow-lg">
    <CardHeader className="pb-3 flex justify-between items-start">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 flex items-center justify-center bg-primary/10 rounded-full">
          <span className="font-bold text-primary">${ticker}</span>
        </div>
        <Badge variant="secondary">{type}</Badge>
      </div>
      {author && (
        <div className="text-xs text-muted-foreground">via {author}</div>
      )}
    </CardHeader>
    <CardContent className="pt-0">
      <p className="text-foreground/90">{content}</p>
    </CardContent>
  </Card>
);

// Feature card with improved styling and hover effects
const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) => (
  <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
    <Card className="h-full transition-all hover:shadow-md border-neutral-200/50 dark:border-neutral-800/50">
      <CardHeader>
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
        <div className="mt-4">
          <Link href="/signup">
            <Button variant="outline" size="sm">Learn More</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Testimonial component
const Testimonial = ({ quote, author, role }: { quote: string; author: string; role: string }) => (
  <Card className="h-full">
    <CardContent className="pt-6">
      <div className="text-4xl text-primary/20 mb-2">"</div>
      <p className="text-foreground/90 italic mb-6">{quote}</p>
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          {author.split(' ').map(word => word[0]).join('')}
        </div>
        <div>
          <p className="font-semibold">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Statistics card component
const StatCard = ({ number, label }: { number: string; label: string }) => (
  <Card className="text-center">
    <CardContent className="pt-6">
      <div className="text-3xl font-bold mb-2">{number}</div>
      <div className="text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Ticker Tape */}
      <TickerTape />

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
              <Badge variant="secondary" className="w-fit">Institutional intelligence for retail investors</Badge>
              
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-5xl lg:text-6xl">
                Don't Let Hedge Funds Have The
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent animate-gradient"> Upper Hand</span>
              </h1>
              
              <p className="text-muted-foreground text-lg md:text-xl">
                Get real-time, personalized stock updates based on hedge fund movements, insider trading, and technical signals.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
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
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              >
                <Card className="w-full max-w-md relative z-10 shadow-xl border-neutral-200/50 dark:border-neutral-800/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="success">New Alert</Badge>
                      <span className="text-sm text-muted-foreground">Just now</span>
                    </div>
                    <CardTitle className="text-lg mt-2">Hedge Fund Activity</CardTitle>
                    <CardDescription className="text-base">
                      Renaissance Technologies increases position in $NVDA by 215%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Source: SEC Filing 13F</span>
                      <Link href="/dashboard">
                        <Button variant="secondary" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Features Section */}
      <Section>
        <Container>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Your Edge in the Market
            </h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              Institutional-level intelligence, delivered when you need it.
            </p>
          </motion.div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={<ChartLineUp className="h-10 w-10 text-primary" />}
              title="Real-time Analysis"
              description="Track hedge fund movements, insider trades, and market sentiment in real-time."
            />
            <FeatureCard 
              icon={<Bell className="h-10 w-10 text-primary" />}
              title="Personalized Alerts"
              description="Get instant notifications about significant events affecting your portfolio."
            />
            <FeatureCard 
              icon={<Eye className="h-10 w-10 text-primary" />}
              title="Dark Pool Insights"
              description="See large institutional trades and option flows before they impact the market."
            />
            <FeatureCard 
              icon={<Zap className="h-10 w-10 text-primary" />}
              title="Lightning Fast"
              description="Receive alerts within seconds of market events occurring."
            />
            <FeatureCard 
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="Option Flow Analysis"
              description="Track big money movements in options to identify potential market shifts."
            />
            <FeatureCard 
              icon={<Clock className="h-10 w-10 text-primary" />}
              title="Weekly Summaries"
              description="Get a comprehensive recap of all major market movements each week."
            />
          </div>
        </Container>
      </Section>

      {/* Social Proof Section */}
      <Section variant="muted">
        <Container>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Trusted by Traders & Investors
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of investors who rely on our platform for market insights
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3 mb-16">
            <StatCard number="10,000+" label="Active Users" />
            <StatCard number="95%" label="Customer Satisfaction" />
            <StatCard number="8,500+" label="Stocks Covered" />
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Testimonial 
              quote="This platform gave me insights I couldn't get anywhere else. I was able to spot institutional movements before they affected my positions."
              author="Sarah Johnson"
              role="Day Trader"
            />
            <Testimonial 
              quote="The hedge fund activity alerts have completely changed how I approach my investment strategy. Worth every penny."
              author="Michael Chen"
              role="Portfolio Manager"
            />
            <Testimonial 
              quote="I've tried many services, but none offer the combination of speed and accuracy that this platform delivers."
              author="Robert Kiyota"
              role="Retail Investor"
            />
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
          
          <div className="grid gap-8 md:grid-cols-3">
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="relative h-full">
                <CardHeader>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>Perfect for active investors</CardDescription>
                  <div className="mt-4 text-4xl font-bold">$29/mo</div>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-4">
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" /> Weekly market summaries
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> 5 custom stock alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" /> Basic technical signals
                    </li>
                  </ul>
                  <Button className="mt-8 w-full">Get Started</Button>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="relative h-full border-primary">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                  Popular
                </div>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>For serious traders</CardDescription>
                  <div className="mt-4 text-4xl font-bold">$79/mo</div>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-4">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" /> Real-time alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" /> Unlimited stock tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" /> Dark pool insights
                    </li>
                    <li className="flex items-center gap-2">
                      <ChartLineUp className="h-4 w-4 text-primary" /> Advanced technical analysis
                    </li>
                  </ul>
                  <Button className="mt-8 w-full">Get Started</Button>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="relative h-full">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For institutions</CardDescription>
                  <div className="mt-4 text-4xl font-bold">Custom</div>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-4">
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" /> Custom integration
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" /> Custom features
                    </li>
                  </ul>
                  <Button variant="outline" className="mt-8 w-full">
                    Contact Sales
                  </Button>
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
              <Button size="lg" className="mt-8 bg-white text-primary hover:bg-white/90">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input 
                      type="email" 
                      placeholder="Your email address" 
                      className="w-full rounded-md px-3 py-2 border border-input bg-background h-10"
                    />
                  </div>
                  <Button>Subscribe</Button>
                </div>
              </div>
              <div className="bg-primary/5 flex items-center justify-center p-6 md:p-8">
                <div className="text-center">
                  <h4 className="font-bold mb-1">Weekly Market Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Analyst insights, hedge fund movements, and more
                  </p>
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
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How are the alerts generated?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Our AI system continuously monitors market data, SEC filings, options flow, and social sentiment to identify significant events that could impact stock prices.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How quickly will I receive alerts?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Real-time alerts are delivered within seconds of detection. Weekly summaries are sent every Sunday evening before market open.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Can I customize which alerts I receive?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Yes, Pro and Enterprise plans allow for custom alert settings based on specific stocks, sectors, event types, and significance thresholds.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How is this different from other services?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>We focus specifically on institutional activity and hedge fund movements, giving you insights typically only available to professional traders.</p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      <footer className="border-t py-12">
        <Container>
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-bold text-lg mb-4">AI Hedge Fund</h3>
              <p className="text-sm text-muted-foreground">
                Institutional intelligence for retail investors. Level the playing field with real-time market insights.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Alerts</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Dashboard</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">API</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Enterprise</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Support</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-center text-sm text-muted-foreground">
              © 2024 AI Hedge Fund. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                <span className="sr-only">Twitter</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                <span className="sr-only">LinkedIn</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                <span className="sr-only">GitHub</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
} 