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
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

export interface EarningsData {
  id: string;
  ticker: string;
  companyName: string;
  fiscalQuarter: string;
  reportDate: string;
  timeOfDay: 'BMO' | 'AMC' | 'TNS'; // Before Market Open, After Market Close, Time Not Specified
  epsEstimate: number;
  epsActual: number | null;
  epsSurprise: number | null;
  revenueEstimate: number; // in millions
  revenueActual: number | null;
  revenueSurprise: number | null;
  marketCap: number;
  previousClose: number;
  nextEarningsDate?: string;
  hasReported: boolean;
}

export function EarningsDataTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ticker, setTicker] = useState("");
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeFrame, setTimeFrame] = useState<string>("1w");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [reportedOnly, setReportedOnly] = useState(false);
  
  const timeFrameMap: Record<string, number> = {
    "1d": 1,
    "3d": 3,
    "1w": 7,
    "2w": 14,
    "1m": 30,
    "3m": 90,
    "all": 0
  };

  useEffect(() => {
    if (ticker) {
      fetchCompanyEarnings();
    } else {
      fetchEarningsCalendar();
    }
  }, [ticker, timeFrame, page, upcomingOnly, reportedOnly]);

  const handleSearch = () => {
    if (searchTerm) {
      setTicker(searchTerm.toUpperCase());
      setPage(1);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setTicker("");
    setPage(1);
  };

  const fetchEarningsCalendar = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Calculate date range based on selected time frame
      const endDate = new Date();
      if (timeFrame !== "all" && !upcomingOnly) {
        // If not showing upcoming only, adjust end date based on time frame
        endDate.setDate(endDate.getDate() + timeFrameMap[timeFrame]);
      } else if (upcomingOnly) {
        // If showing upcoming only, set end date far in the future
        endDate.setDate(endDate.getDate() + 90); // 3 months ahead
      }
      
      const startDate = new Date();
      if (timeFrame !== "all" && !reportedOnly) {
        // If not showing reported only, adjust start date based on time frame
        startDate.setDate(startDate.getDate() - timeFrameMap[timeFrame]);
      } else if (reportedOnly) {
        // If showing reported only, set start date far in the past
        startDate.setDate(startDate.getDate() - 90); // 3 months back
      }
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        ...(upcomingOnly && { has_reported: "false" }),
        ...(reportedOnly && { has_reported: "true" }),
      });
      
      const response = await fetchAPI<{ 
        success: boolean; 
        data: EarningsData[]; 
        pagination: { total_pages: number } 
      }>(`/api/financial-data/earnings-calendar?${queryParams.toString()}`);
      
      if (response.success) {
        setEarnings(response.data);
        setTotalPages(response.pagination.total_pages);
      } else {
        setError("Failed to fetch earnings calendar");
      }
    } catch (err) {
      setError("An error occurred while fetching earnings calendar");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyEarnings = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetchAPI<{ 
        success: boolean; 
        data: EarningsData[];
        pagination: { total_pages: number }
      }>(`/api/financial-data/company-earnings?ticker=${ticker}&page=${page}&limit=8`);
      
      if (response.success) {
        setEarnings(response.data);
        setTotalPages(response.pagination.total_pages);
      } else {
        setError(`Failed to fetch earnings data for ${ticker}`);
      }
    } catch (err) {
      setError(`An error occurred while fetching earnings data for ${ticker}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
      notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard',
    }).format(value);
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return "N/A";
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number | null) => {
    if (value === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getSurpriseColor = (surprise: number | null) => {
    if (surprise === null) return "bg-gray-100 text-gray-800";
    if (surprise > 0.05) return "bg-green-100 text-green-800"; // >5% beat
    if (surprise > 0) return "bg-green-50 text-green-600"; // 0-5% beat
    if (surprise < -0.05) return "bg-red-100 text-red-800"; // >5% miss
    if (surprise < 0) return "bg-red-50 text-red-600"; // 0-5% miss
    return "bg-blue-50 text-blue-600"; // met expectations
  };

  const getTimeOfDayLabel = (timeOfDay: string) => {
    switch(timeOfDay) {
      case 'BMO': return "Before Market Open";
      case 'AMC': return "After Market Close";
      default: return "Time Not Specified";
    }
  };

  const isDueSoon = (dateString: string) => {
    if (!dateString) return false;
    const reportDate = new Date(dateString);
    const now = new Date();
    const diffTime = reportDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3; // Due within 3 days
  };

  const getEarningsChartData = () => {
    if (!ticker || earnings.length === 0) return [];
    
    // Sort earnings by report date (oldest first)
    return [...earnings]
      .filter(item => item.hasReported && item.epsActual !== null)
      .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())
      .map(item => ({
        quarter: item.fiscalQuarter,
        epsEstimate: item.epsEstimate,
        epsActual: item.epsActual,
        revenueEstimate: item.revenueEstimate / 1000, // Convert to billions for better display
        revenueActual: item.revenueActual !== null ? item.revenueActual / 1000 : null, // Convert to billions
      }));
  };

  const renderEarningsCalendar = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Report Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>EPS Est.</TableHead>
            <TableHead>Revenue Est.</TableHead>
            <TableHead>Market Cap</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {earnings.length > 0 ? (
            earnings.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.ticker}</TableCell>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {formatDate(item.reportDate)}
                    {isDueSoon(item.reportDate) && !item.hasReported && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                        Due Soon
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getTimeOfDayLabel(item.timeOfDay)}</TableCell>
                <TableCell>{item.epsEstimate.toFixed(2)}</TableCell>
                <TableCell>{formatCurrency(item.revenueEstimate)}</TableCell>
                <TableCell>{formatCurrency(item.marketCap)}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm(item.ticker);
                      setTicker(item.ticker);
                    }}
                  >
                    Details
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
                  "No earnings data found for the selected criteria"
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderCompanyEarnings = () => (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{ticker}</h2>
          {earnings.length > 0 && (
            <p className="text-muted-foreground">{earnings[0].companyName}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={clearSearch}>
          Back to Calendar
        </Button>
      </div>

      {earnings.length > 0 && earnings[0].nextEarningsDate && (
        <Card className="bg-muted/40">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Next Earnings Date</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">{formatDate(earnings[0].nextEarningsDate as string)}</span>
                  {isDueSoon(earnings[0].nextEarningsDate as string) && (
                    <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  {getTimeOfDayLabel(earnings.find(e => e.reportDate === earnings[0].nextEarningsDate)?.timeOfDay || 'TNS')}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Consensus Estimates</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-muted-foreground">EPS</p>
                    <p className="text-lg font-bold">
                      {earnings.find(e => e.reportDate === earnings[0].nextEarningsDate)?.epsEstimate.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(earnings.find(e => e.reportDate === earnings[0].nextEarningsDate)?.revenueEstimate || null)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {earnings.some(e => e.hasReported && e.epsActual !== null) && (
        <div className="h-80">
          <h3 className="text-lg font-semibold mb-4">Historical Earnings Performance</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={getEarningsChartData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'EPS ($)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Revenue ($B)', angle: 90, position: 'insideRight' }} />
              <Tooltip formatter={(value, name) => {
                if (name === "revenueEstimate" || name === "revenueActual") {
                  return [`$${(value as number).toFixed(2)}B`, typeof name === 'string' ? name.replace(/([A-Z])/g, ' $1').trim() : name];
                }
                return [`$${value}`, typeof name === 'string' ? name.replace(/([A-Z])/g, ' $1').trim() : name];
              }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="epsEstimate" stroke="#8884d8" name="EPS Estimate" />
              <Line yAxisId="left" type="monotone" dataKey="epsActual" stroke="#82ca9d" name="EPS Actual" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="revenueEstimate" stroke="#ff7300" name="Revenue Estimate" strokeDasharray="5 5" />
              <Line yAxisId="right" type="monotone" dataKey="revenueActual" stroke="#ff0000" name="Revenue Actual" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quarter</TableHead>
              <TableHead>Report Date</TableHead>
              <TableHead>EPS Est.</TableHead>
              <TableHead>EPS Act.</TableHead>
              <TableHead>EPS Surprise</TableHead>
              <TableHead>Rev Est.</TableHead>
              <TableHead>Rev Act.</TableHead>
              <TableHead>Rev Surprise</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.fiscalQuarter}</TableCell>
                <TableCell>{formatDate(item.reportDate)}</TableCell>
                <TableCell>${item.epsEstimate.toFixed(2)}</TableCell>
                <TableCell>${item.epsActual !== null ? item.epsActual.toFixed(2) : "N/A"}</TableCell>
                <TableCell>
                  {item.epsSurprise !== null && (
                    <Badge className={getSurpriseColor(item.epsSurprise)}>
                      {formatPercentage(item.epsSurprise)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(item.revenueEstimate)}</TableCell>
                <TableCell>{formatCurrency(item.revenueActual)}</TableCell>
                <TableCell>
                  {item.revenueSurprise !== null && (
                    <Badge className={getSurpriseColor(item.revenueSurprise)}>
                      {formatPercentage(item.revenueSurprise)}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  if (loading && page === 1 && !ticker) {
    return <LoadingSkeleton />;
  }

  if (error && !earnings.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => ticker ? fetchCompanyEarnings() : fetchEarningsCalendar()}
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
        <CardTitle>{ticker ? `${ticker} Earnings History` : "Earnings Calendar"}</CardTitle>
        <CardDescription>
          {ticker 
            ? "View historical earnings data and upcoming earnings releases" 
            : "Track upcoming and recent earnings reports for public companies"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {!ticker && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by ticker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  className="w-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </div>
              <div className="flex flex-row flex-wrap gap-2">
                <select
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value)}
                  className="border rounded p-2"
                  disabled={upcomingOnly || reportedOnly}
                >
                  <option value="1d">±1 day</option>
                  <option value="3d">±3 days</option>
                  <option value="1w">±1 week</option>
                  <option value="2w">±2 weeks</option>
                  <option value="1m">±1 month</option>
                  <option value="3m">±3 months</option>
                  <option value="all">All time</option>
                </select>
                
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    id="upcomingOnly"
                    checked={upcomingOnly}
                    onChange={(e) => {
                      setUpcomingOnly(e.target.checked);
                      if (e.target.checked) setReportedOnly(false);
                    }}
                  />
                  <label htmlFor="upcomingOnly">Upcoming only</label>
                </div>
                
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    id="reportedOnly"
                    checked={reportedOnly}
                    onChange={(e) => {
                      setReportedOnly(e.target.checked);
                      if (e.target.checked) setUpcomingOnly(false);
                    }}
                  />
                  <label htmlFor="reportedOnly">Reported only</label>
                </div>
              </div>
            </div>
          )}

          {ticker ? renderCompanyEarnings() : renderEarningsCalendar()}
          
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
          
          <div className="rounded-md border">
            <div className="p-2">
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 