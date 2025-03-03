"use client"

import { useState, useCallback } from "react"
import { Container } from "@/components/ui/Container"
import { Card } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/Button"
import { Bot, InfoIcon, ChevronDown, ChevronUp } from "lucide-react"
import { aiChatService } from "@/lib/ai-service"
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

// Sample historical data for charts
const buffettHistoricalData = [
  { month: "Jan", value: 140 },
  { month: "Feb", value: 143 },
  { month: "Mar", value: 148 },
  { month: "Apr", value: 145 },
  { month: "May", value: 147 },
  { month: "Jun", value: 149 },
  { month: "Jul", value: 152 },
  { month: "Aug", value: 150 },
]

const fearGreedHistoricalData = [
  { month: "Jan", value: 55 },
  { month: "Feb", value: 62 },
  { month: "Mar", value: 68 },
  { month: "Apr", value: 70 },
  { month: "May", value: 72 },
  { month: "Jun", value: 75 },
  { month: "Jul", value: 78 },
  { month: "Aug", value: 75 },
]

const spRsiHistoricalData = [
  { month: "Jan", value: 52 },
  { month: "Feb", value: 55 },
  { month: "Mar", value: 60 },
  { month: "Apr", value: 63 },
  { month: "May", value: 64 },
  { month: "Jun", value: 65 },
  { month: "Jul", value: 67 },
  { month: "Aug", value: 65 },
]

// Gauge chart configuration
const createGaugeData = (value: number) => {
  return [
    { name: "value", value },
    { name: "empty", value: 100 - value }
  ]
}

// Custom label for gauge charts
const renderCustomizedLabel = ({ cx, cy, value }: any) => {
  return (
    <text x={cx} y={cy} fill="#888" textAnchor="middle" dominantBaseline="central">
      {`${value}%`}
    </text>
  )
}

// Add interface for props
interface MarketIndicatorsSectionProps {
  openAiChatAction?: (context: string) => void;
}

export function MarketIndicatorsSection({ openAiChatAction }: MarketIndicatorsSectionProps = {}) {
  const [viewMode, setViewMode] = useState<'gauge' | 'history'>('gauge')
  const [showAiInsights, setShowAiInsights] = useState(false)
  const [rsiInsights, setRsiInsights] = useState<string | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  
  // Generate AI insights for RSI
  const generateRsiInsights = useCallback(async () => {
    if (rsiInsights) {
      // Toggle visibility if insights already exist
      setShowAiInsights(prev => !prev);
      return;
    }
    
    setLoadingInsights(true);
    setShowAiInsights(true);
    
    try {
      const result = await aiChatService.generateInsights("S&P 500 RSI Technical Analysis", {
        currentRSI: 65,
        historicalData: spRsiHistoricalData,
        overboughtThreshold: 70,
        oversoldThreshold: 30
      });
      
      setRsiInsights(result.text);
    } catch (error) {
      console.error("Error generating RSI insights:", error);
      setRsiInsights("Unable to generate insights at this time. Please try again later.");
    } finally {
      setLoadingInsights(false);
    }
  }, [rsiInsights]);
  
  return (
    <div className="border-b bg-card">
      <Container>
        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Market Indicators</h2>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'gauge' | 'history')}>
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="gauge">Gauge View</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Buffett Indicator */}
            <Card className="p-4 overflow-hidden">
              <div className="mb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Buffett Indicator</h3>
                  <p className="text-xs text-muted-foreground">Market Valuation Metric</p>
                </div>
                {openAiChatAction && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => 
                      openAiChatAction(
                        "Explain the Buffett Indicator, which is currently at 150%. What does this high reading mean for the overall market valuation and potential risks?"
                      )
                    }
                  >
                    <Bot className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {viewMode === 'gauge' ? (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={createGaugeData(150)}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        label={renderCustomizedLabel}
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                      <text x="50%" y="120" textAnchor="middle" className="text-xs">
                        Significantly Overvalued
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={buffettHistoricalData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="buffettColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[120, 160]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#ef4444" 
                        fillOpacity={1} 
                        fill="url(#buffettColor)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Fear & Greed Index */}
            <Card className="p-4 overflow-hidden">
              <div className="mb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Fear & Greed Index</h3>
                  <p className="text-xs text-muted-foreground">Market Sentiment Indicator</p>
                </div>
                {openAiChatAction && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => 
                      openAiChatAction(
                        "The Fear & Greed Index is currently showing 'Extreme Greed' at 75. What does this tell us about market sentiment and how might this affect market performance in the near term?"
                      )
                    }
                  >
                    <Bot className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {viewMode === 'gauge' ? (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={createGaugeData(75)}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        label={renderCustomizedLabel}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                      <text x="50%" y="120" textAnchor="middle" className="text-xs">
                        Extreme Greed
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={fearGreedHistoricalData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="fearGreedColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#22c55e" 
                        fillOpacity={1} 
                        fill="url(#fearGreedColor)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* S&P 500 RSI */}
            <Card className="p-4 overflow-hidden">
              <div className="mb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">S&P 500 RSI</h3>
                  <p className="text-xs text-muted-foreground">Relative Strength Index</p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={generateRsiInsights}
                  >
                    <span className="mr-1">AI Insights</span>
                    {showAiInsights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  {openAiChatAction && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => 
                        openAiChatAction(
                          "The S&P 500 RSI is currently at 65, indicating it's slightly overbought. Can you explain what RSI measures, what this level means, and how traders typically use this information?"
                        )
                      }
                    >
                      <Bot className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {viewMode === 'gauge' ? (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={createGaugeData(65)}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        label={renderCustomizedLabel}
                      >
                        <Cell fill="#f59e0b" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                      <text x="50%" y="120" textAnchor="middle" className="text-xs">
                        Slightly Overbought
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={spRsiHistoricalData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="rsiColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[30, 70]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#f59e0b" 
                        fillOpacity={1} 
                        fill="url(#rsiColor)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* AI Insights Panel */}
              {showAiInsights && (
                <div className="mt-3 border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">AI Technical Analysis</h4>
                  {loadingInsights ? (
                    <div className="flex items-center justify-center py-3">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150"></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-300"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-line">
                      {rsiInsights}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </Container>
    </div>
  )
} 