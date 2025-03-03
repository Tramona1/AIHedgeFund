"use client";

import { useState } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Card, CardContent } from "@/components/ui/Card";
import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSummary } from "@/components/financial-data/DashboardSummary";
import { YouTubeVideosTab } from "@/components/financial-data/YouTubeVideosTab";
import { BankReportsTab } from "@/components/financial-data/BankReportsTab";
import { InsiderTradesTab } from "@/components/financial-data/InsiderTradesTab";
import { PoliticalTradesTab } from "@/components/financial-data/PoliticalTradesTab";
import { HedgeFundTradesTab } from "@/components/financial-data/HedgeFundTradesTab";
import { FinancialNewsTab } from "@/components/financial-data/FinancialNewsTab";
import { AnalystSentimentTab } from "@/components/financial-data/AnalystSentimentTab";
import { EarningsDataTab } from "@/components/financial-data/EarningsDataTab";

export default function FinancialDataPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <PageContainer>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Data</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive financial data, news, and analysis to drive your investment decisions
          </p>
        </div>

        <Tabs defaultValue="dashboard" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-9 gap-2 w-full">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analyst-sentiment">Analyst Sentiment</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="bank-reports">Bank Reports</TabsTrigger>
            <TabsTrigger value="insider-trades">Insider Trades</TabsTrigger>
            <TabsTrigger value="political-trades">Political Trades</TabsTrigger>
            <TabsTrigger value="hedge-fund-trades">Hedge Fund Trades</TabsTrigger>
            <TabsTrigger value="financial-news">Financial News</TabsTrigger>
            <TabsTrigger value="youtube-videos">YouTube Videos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <DashboardSummary />
          </TabsContent>
          
          <TabsContent value="analyst-sentiment">
            <AnalystSentimentTab />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsDataTab />
          </TabsContent>
          
          <TabsContent value="bank-reports">
            <BankReportsTab />
          </TabsContent>
          
          <TabsContent value="insider-trades">
            <InsiderTradesTab />
          </TabsContent>
          
          <TabsContent value="political-trades">
            <PoliticalTradesTab />
          </TabsContent>
          
          <TabsContent value="hedge-fund-trades">
            <HedgeFundTradesTab />
          </TabsContent>
          
          <TabsContent value="financial-news">
            <FinancialNewsTab />
          </TabsContent>
          
          <TabsContent value="youtube-videos">
            <YouTubeVideosTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
} 