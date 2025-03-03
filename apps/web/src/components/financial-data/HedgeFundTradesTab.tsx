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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export interface HedgeFundFiling {
  id: string;
  fundName: string;
  manager: string;
  ticker: string;
  companyName: string;
  action: 'buy' | 'sell' | 'hold';
  shares: number;
  value: number;
  percentPortfolio: number;
  quarterEnd: string;
  filingDate: string;
}

export function HedgeFundTradesTab() {
  const [filings, setFilings] = useState<HedgeFundFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fundFilter, setFundFilter] = useState<string>("");
  const [tickerFilter, setTickerFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFund, setSelectedFund] = useState<string | null>(null);
  const [fundPositions, setFundPositions] = useState<HedgeFundFiling[]>([]);
  const [showPositions, setShowPositions] = useState(false);
  
  useEffect(() => {
    fetchHedgeFundFilings();
  }, [page, fundFilter, tickerFilter, actionFilter]);

  useEffect(() => {
    if (selectedFund) {
      fetchFundPositions(selectedFund);
    }
  }, [selectedFund]);

  const fetchHedgeFundFilings = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(fundFilter && { fund_name: fundFilter }),
        ...(tickerFilter && { ticker: tickerFilter }),
        ...(actionFilter !== "all" && { action: actionFilter }),
      });
      
      const response = await fetchAPI<{ 
        success: boolean; 
        data: HedgeFundFiling[]; 
        pagination: { total_pages: number } 
      }>(`/api/financial-data/hedge-fund-filings?${queryParams.toString()}`);
      
      if (response.success) {
        setFilings(response.data);
        setTotalPages(response.pagination.total_pages);
      } else {
        setError("Failed to fetch hedge fund filings");
      }
    } catch (err) {
      setError("An error occurred while fetching hedge fund filings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFundPositions = async (fundName: string) => {
    try {
      setLoading(true);
      
      const response = await fetchAPI<{ 
        success: boolean; 
        data: HedgeFundFiling[];
      }>(`/api/financial-data/hedge-fund-positions?fund_name=${encodeURIComponent(fundName)}`);
      
      if (response.success) {
        setFundPositions(response.data);
        setShowPositions(true);
      } else {
        setError(`Failed to fetch positions for ${fundName}`);
      }
    } catch (err) {
      setError(`An error occurred while fetching positions for ${fundName}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFilings = filings.filter(filing => {
    const matchesSearch = !searchQuery || 
      filing.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
      filing.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filing.fundName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filing.manager.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesSearch;
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

  const getActionBadgeColor = (action: string) => {
    switch(action) {
      case 'buy':
        return "bg-green-100 text-green-800";
      case 'sell':
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const prepareChartData = () => {
    if (!selectedFund || fundPositions.length === 0) return [];
    
    // Sort by value for better visualization
    return [...fundPositions]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 holdings
      .map(position => ({
        ticker: position.ticker,
        value: position.value,
        percentPortfolio: position.percentPortfolio * 100,
      }));
  };

  const closePositionsView = () => {
    setShowPositions(false);
    setSelectedFund(null);
    setFundPositions([]);
  };

  if (loading && page === 1 && !showPositions) {
    return <LoadingSkeleton />;
  }

  if (error && !filings.length && !showPositions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => fetchHedgeFundFilings()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showPositions && selectedFund) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{selectedFund} - Current Positions</CardTitle>
              <CardDescription>Top holdings as of last filing date</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={closePositionsView}>
              Back to All Filings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {fundPositions.length > 0 ? (
              <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="ticker" 
                        angle={-45} 
                        textAnchor="end" 
                        tick={{ fontSize: 12 }}
                        height={60}
                      />
                      <YAxis yAxisId="left" orientation="left" label={{ value: 'Value ($)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Portfolio %', angle: 90, position: 'insideRight' }} />
                      <Tooltip formatter={(value, name) => {
                        if (name === "value") return formatCurrency(value as number);
                        if (name === "percentPortfolio") return `${(value as number).toFixed(2)}%`;
                        return value;
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="value" fill="#8884d8" name="Position Value" />
                      <Bar yAxisId="right" dataKey="percentPortfolio" fill="#82ca9d" name="% of Portfolio" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="rounded-md border mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Shares</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>% of Portfolio</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundPositions.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">{position.ticker}</TableCell>
                          <TableCell>{position.companyName}</TableCell>
                          <TableCell>{formatNumber(position.shares)}</TableCell>
                          <TableCell>{formatCurrency(position.value)}</TableCell>
                          <TableCell>{formatPercentage(position.percentPortfolio)}</TableCell>
                          <TableCell>
                            <Badge className={getActionBadgeColor(position.action)}>
                              {position.action.charAt(0).toUpperCase() + position.action.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p>No position data available for this fund.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hedge Fund Trades</CardTitle>
        <CardDescription>
          Track the latest 13F filings from top hedge funds and investment managers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search funds, managers or tickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-row gap-2">
              <Input
                placeholder="Fund name..."
                value={fundFilter}
                onChange={(e) => setFundFilter(e.target.value)}
                className="w-40"
              />
              
              <Input
                placeholder="Ticker..."
                value={tickerFilter}
                onChange={(e) => setTickerFilter(e.target.value.toUpperCase())}
                className="w-24"
              />
              
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="all">All Actions</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="hold">Hold</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund / Manager</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>% of Portfolio</TableHead>
                  <TableHead>Filing Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFilings.length > 0 ? (
                  filteredFilings.map((filing) => (
                    <TableRow key={filing.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{filing.fundName}</div>
                          <div className="text-xs text-muted-foreground">{filing.manager}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{filing.ticker}</div>
                          <div className="text-xs text-muted-foreground">{filing.companyName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(filing.action)}>
                          {filing.action.charAt(0).toUpperCase() + filing.action.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatNumber(filing.shares)}</TableCell>
                      <TableCell>{formatCurrency(filing.value)}</TableCell>
                      <TableCell>{formatPercentage(filing.percentPortfolio)}</TableCell>
                      <TableCell>{new Date(filing.filingDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedFund(filing.fundName);
                          }}
                        >
                          View Positions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      {loading ? (
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                        </div>
                      ) : (
                        "No hedge fund filings found"
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