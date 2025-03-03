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

export interface BankReport {
  id: string;
  bank_name: string;
  report_title: string;
  report_date: string;
  report_type: string;
  metrics: Record<string, any>;
  summary: string;
  file_url: string;
  source: string;
}

export function BankReportsTab() {
  const [reports, setReports] = useState<BankReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [timeFrame, setTimeFrame] = useState<string>("1y");
  
  const timeFrameMap: Record<string, number> = {
    "3m": 90,
    "6m": 180,
    "1y": 365,
    "all": 0
  };

  useEffect(() => {
    fetchReports();
  }, [page, bankFilter, reportTypeFilter, timeFrame]);

  const fetchReports = async () => {
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
        ...(bankFilter !== "all" && { bank_name: bankFilter }),
        ...(reportTypeFilter !== "all" && { report_type: reportTypeFilter })
      });
      
      const response = await fetchAPI<{ 
        success: boolean; 
        data: BankReport[]; 
        pagination: { total_pages: number } 
      }>(`/financial-data/bank-reports?${queryParams.toString()}`);
      
      if (response.success) {
        setReports(response.data);
        setTotalPages(response.pagination.total_pages);
      } else {
        setError("Failed to fetch bank reports");
      }
    } catch (err) {
      setError("An error occurred while fetching bank reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchQuery || 
      report.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      report.report_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.summary.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesSearch;
  });

  const banks = ["all", "JP Morgan", "Goldman Sachs", "Morgan Stanley", "Bank of America", "Citigroup", "Wells Fargo"];
  const reportTypes = ["all", "quarterly", "annual", "research", "economic", "market"];

  // Extract key financial metrics for display
  const getKeyMetrics = (report: BankReport) => {
    if (!report.metrics) return "No metrics available";
    
    const metrics = [];
    
    if (report.metrics.revenue) metrics.push(`Revenue: $${report.metrics.revenue}B`);
    if (report.metrics.earnings) metrics.push(`Earnings: $${report.metrics.earnings}B`);
    if (report.metrics.eps) metrics.push(`EPS: $${report.metrics.eps}`);
    if (report.metrics.net_income) metrics.push(`Net Income: $${report.metrics.net_income}B`);
    
    return metrics.length ? metrics.join(" | ") : "No metrics available";
  };

  if (loading && page === 1) {
    return <LoadingSkeleton />;
  }

  if (error && !reports.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => fetchReports()}
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
        <CardTitle>Bank Reports</CardTitle>
        <CardDescription>
          Quarterly reports, annual reports, and research publications from major banks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-row gap-2">
              <select
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
              >
                {banks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank === "all" ? "All Banks" : bank}
                  </option>
                ))}
              </select>
              
              <select
                value={reportTypeFilter}
                onChange={(e) => setReportTypeFilter(e.target.value)}
              >
                {reportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
              >
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
                  <TableHead>Bank</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Key Metrics</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.bank_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.report_title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.summary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(report.report_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {report.report_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {getKeyMetrics(report)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(report.file_url, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      {loading ? (
                        <div className="flex justify-center">
                          <p className="text-muted-foreground">Loading reports...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-muted-foreground">No bank reports found</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setBankFilter("all");
                              setReportTypeFilter("all");
                              setTimeFrame("1y");
                              setPage(1);
                            }}
                          >
                            Reset filters
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-4 w-[300px] mt-2" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <div className="flex flex-row gap-2">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
          </div>
          
          <div className="rounded-md border">
            <div className="p-4">
              <div className="flex items-center gap-4 py-3">
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[150px]" />
                <Skeleton className="h-5 w-[80px]" />
              </div>
              
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-t">
                  <Skeleton className="h-6 w-[100px]" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-[180px]" />
                    <Skeleton className="h-4 w-[250px] mt-1" />
                  </div>
                  <Skeleton className="h-6 w-[80px]" />
                  <Skeleton className="h-6 w-[80px]" />
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-8 w-[60px]" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-[120px]" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-[80px]" />
              <Skeleton className="h-9 w-[80px]" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 