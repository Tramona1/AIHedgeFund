"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI } from "@/lib/api";

export interface InsiderTrade {
  id: string;
  ticker: string;
  companyName: string;
  insiderName: string;
  position: string;
  tradeDate: string;
  sharesPurchased: number;
  sharesSold: number;
  pricePerShare: number;
  totalValue: number;
  sharesOwned: number;
  percentOwned: number;
  filingDate: string;
  filingUrl: string;
}

export function InsiderTradesTab() {
  const [trades, setTrades] = useState<InsiderTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tickerFilter, setTickerFilter] = useState<string>("");
  const [insiderFilter, setInsiderFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [timeFrame, setTimeFrame] = useState<string>("1m");
  
  const timeFrameMap: Record<string, number> = {
    "1w": 7,
    "1m": 30,
    "3m": 90,
    "6m": 180,
    "1y": 365,
    "all": 0
  };

  useEffect(() => {
    fetchInsiderTrades();
  }, [page, tickerFilter, timeFrame]);

  const fetchInsiderTrades = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected time frame
      const endDate = new Date().toISOString();
      let startDate = "";
      
      if (timeFrame !== "all") {
        const days = timeFrameMap[timeFrame];
        const start = new Date();
        start.setDate(start.getDate() - days);
        startDate = start.toISOString();
      }
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(tickerFilter && { ticker: tickerFilter }),
      });
      
      const response = await fetchAPI<{ 
        success: boolean; 
        data: InsiderTrade[]; 
        pagination: { total_pages: number } 
      }>(`/api/financial-data/insider-trades?${queryParams.toString()}`);
      
      if (response.success) {
        setTrades(response.data);
        setTotalPages(response.pagination.total_pages);
      } else {
        setError("Failed to fetch insider trades");
      }
    } catch (err) {
      setError("An error occurred while fetching insider trades");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = !searchQuery || 
      trade.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
      trade.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.insiderName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesInsider = !insiderFilter || 
      trade.insiderName.toLowerCase().includes(insiderFilter.toLowerCase()) ||
      trade.position.toLowerCase().includes(insiderFilter.toLowerCase());
      
    return matchesSearch && matchesInsider;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
      notation: value >= 1000000 ? 'compact' : 'standard',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
      notation: value >= 1000000 ? 'compact' : 'standard',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getTradeTypeAndColor = (trade: InsiderTrade) => {
    if (trade.sharesPurchased > 0) {
      return { type: "Purchase", color: "bg-green-100 text-green-800" };
    } else if (trade.sharesSold > 0) {
      return { type: "Sale", color: "bg-red-100 text-red-800" };
    }
    return { type: "Other", color: "bg-gray-100 text-gray-800" };
  };

  if (loading && page === 1) {
    return <LoadingSkeleton />;
  }

  if (error && !trades.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => fetchInsiderTrades()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insider Trades</CardTitle>
        <CardDescription>
          Monitor insider buying and selling activities across public companies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by ticker or company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-row gap-2">
              <Input
                placeholder="Filter by ticker..."
                value={tickerFilter}
                onChange={(e) => setTickerFilter(e.target.value.toUpperCase())}
                className="w-32"
              />
              
              <Input
                placeholder="Filter by insider..."
                value={insiderFilter}
                onChange={(e) => setInsiderFilter(e.target.value)}
                className="w-40"
              />
              
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                className="border rounded p-2"
              >
                <option value="1w">Last week</option>
                <option value="1m">Last month</option>
                <option value="3m">Last 3 months</option>
                <option value="6m">Last 6 months</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Insider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length > 0 ? (
                  filteredTrades.map((trade) => {
                    const { type, color } = getTradeTypeAndColor(trade);
                    return (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{trade.ticker}</div>
                            <div className="text-xs text-muted-foreground">{trade.companyName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{trade.insiderName}</div>
                            <div className="text-xs text-muted-foreground">{trade.position}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(trade.tradeDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={color}>
                            {type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {type === "Purchase" ? formatNumber(trade.sharesPurchased) : formatNumber(trade.sharesSold)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(trade.pricePerShare)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(trade.totalValue)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{formatNumber(trade.sharesOwned)} shares</div>
                            <div className="text-xs text-muted-foreground">{formatPercentage(trade.percentOwned)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(trade.filingUrl, '_blank')}
                          >
                            View Filing
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6">
                      {loading ? (
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                        </div>
                      ) : (
                        "No insider trades found"
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle><Skeleton className="h-8 w-1/3" /></CardTitle>
        <CardDescription><Skeleton className="h-4 w-2/3" /></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 