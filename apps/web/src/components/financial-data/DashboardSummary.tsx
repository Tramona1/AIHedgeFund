"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI } from "@/lib/api";

interface SummaryData {
  bankReports: any[];
  youtubeVideos: any[];
  insiderTrades: any[];
  politicalTrades: any[];
  hedgeFundTrades: any[];
  financialNews: any[];
}

export function DashboardSummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchAPI<{ success: boolean; data: SummaryData }>(
          '/financial-data/dashboard-summary'
        );
        
        if (response.success) {
          setData(response.data);
        } else {
          setError("Failed to fetch dashboard data");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Bank Reports Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Bank Reports</CardTitle>
          <CardDescription>Latest quarterly reports from major banks</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.bankReports && data.bankReports.length > 0 ? (
            <ul className="space-y-2">
              {data.bankReports.slice(0, 3).map((report) => (
                <li key={report.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{report.bank_name}</p>
                      <p className="text-sm text-muted-foreground">{report.report_title || "Quarterly Report"}</p>
                    </div>
                    <Badge>{new Date(report.report_date).toLocaleDateString()}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No bank reports available</p>
          )}
          <Button variant="link" className="px-0 mt-2">
            View all bank reports
          </Button>
        </CardContent>
      </Card>

      {/* YouTube Videos Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">YouTube Videos</CardTitle>
          <CardDescription>Latest financial analysis videos</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.youtubeVideos && data.youtubeVideos.length > 0 ? (
            <ul className="space-y-2">
              {data.youtubeVideos.slice(0, 3).map((video) => (
                <li key={video.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{video.title}</p>
                      <p className="text-sm text-muted-foreground">{video.channel}</p>
                    </div>
                    <Badge>{new Date(video.publish_date).toLocaleDateString()}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No videos available</p>
          )}
          <Button variant="link" className="px-0 mt-2">
            View all videos
          </Button>
        </CardContent>
      </Card>

      {/* Insider Trades Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Insider Trades</CardTitle>
          <CardDescription>Recent insider buying and selling activity</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.insiderTrades && data.insiderTrades.length > 0 ? (
            <ul className="space-y-2">
              {data.insiderTrades.slice(0, 3).map((trade) => (
                <li key={trade.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{trade.symbol} - {trade.insider_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {trade.transaction_type === "buy" ? "Bought" : "Sold"} {trade.shares.toLocaleString()} shares
                      </p>
                    </div>
                    <Badge 
                      className={trade.transaction_type === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {trade.transaction_type.toUpperCase()}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No insider trades available</p>
          )}
          <Button variant="link" className="px-0 mt-2">
            View all insider trades
          </Button>
        </CardContent>
      </Card>

      {/* Political Trades Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Political Trades</CardTitle>
          <CardDescription>Recent trading by politicians</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.politicalTrades && data.politicalTrades.length > 0 ? (
            <ul className="space-y-2">
              {data.politicalTrades.slice(0, 3).map((trade) => (
                <li key={trade.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{trade.symbol} - {trade.politician_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {trade.transaction_type}
                      </p>
                    </div>
                    <Badge>{new Date(trade.transaction_date).toLocaleDateString()}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No political trades available</p>
          )}
          <Button variant="link" className="px-0 mt-2">
            View all political trades
          </Button>
        </CardContent>
      </Card>

      {/* Hedge Fund Trades Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Hedge Fund Activity</CardTitle>
          <CardDescription>Latest 13F filings and position changes</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.hedgeFundTrades && data.hedgeFundTrades.length > 0 ? (
            <ul className="space-y-2">
              {data.hedgeFundTrades.slice(0, 3).map((trade) => (
                <li key={trade.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{trade.fund_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {trade.change_type} {trade.symbol} ({trade.percent_change}%)
                      </p>
                    </div>
                    <Badge>{new Date(trade.filing_date).toLocaleDateString()}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No hedge fund data available</p>
          )}
          <Button variant="link" className="px-0 mt-2">
            View all hedge fund activity
          </Button>
        </CardContent>
      </Card>

      {/* Financial News Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Financial News</CardTitle>
          <CardDescription>Latest market news and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.financialNews && data.financialNews.length > 0 ? (
            <ul className="space-y-2">
              {data.financialNews.slice(0, 3).map((news) => (
                <li key={news.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{news.title}</p>
                      <p className="text-sm text-muted-foreground">{news.source}</p>
                    </div>
                    <Badge 
                      className={
                        news.sentiment > 0.3 ? "bg-green-100 text-green-800" : 
                        news.sentiment < -0.3 ? "bg-red-100 text-red-800" : 
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {news.sentiment > 0.3 ? "POSITIVE" : 
                       news.sentiment < -0.3 ? "NEGATIVE" : 
                       "NEUTRAL"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No financial news available</p>
          )}
          <Button variant="link" className="px-0 mt-2">
            View all financial news
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-[140px]" />
            <Skeleton className="h-4 w-[200px] mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-5 w-[180px]" />
                      <Skeleton className="h-4 w-[150px] mt-1" />
                    </div>
                    <Skeleton className="h-5 w-[60px]" />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="h-4 w-[100px] mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 