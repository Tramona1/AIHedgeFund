import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchAPI } from "@/lib/api";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export interface PoliticalTrade {
  id: string;
  politician_name: string;
  politician_office: string;
  party: string;
  symbol: string;
  asset_description: string;
  transaction_type: string;
  transaction_date: string;
  amount_range: string;
  filing_date: string;
  source: string;
}

export function PoliticalTradesTab() {
  const [trades, setTrades] = useState<PoliticalTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [party, setParty] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState("transaction_date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchTrades();
  }, [currentPage, party, transactionType, startDate, endDate, sortBy, sortOrder]);

  const fetchTrades = async () => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/financial-data/political-trades?page=${currentPage}&limit=10`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (party) {
        url += `&party=${party}`;
      }
      
      if (transactionType) {
        url += `&transaction_type=${transactionType}`;
      }
      
      if (startDate) {
        url += `&start_date=${format(startDate, "yyyy-MM-dd")}`;
      }
      
      if (endDate) {
        url += `&end_date=${format(endDate, "yyyy-MM-dd")}`;
      }
      
      if (sortBy) {
        url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
      }

      const data = await fetchAPI<{
        data: PoliticalTrade[];
        totalCount: number;
        page: number;
        pageSize: number;
      }>(url);
      
      setTrades(data.data);
      setTotalPages(Math.ceil(data.totalCount / data.pageSize));
    } catch (err) {
      console.error("Error fetching political trades:", err);
      setError("Failed to load political trades. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTrades();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setParty("");
    setTransactionType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
    fetchTrades();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionTypeColor = (type: string) => {
    type = type.toLowerCase();
    if (type.includes('purchase')) return "bg-green-100 text-green-800";
    if (type.includes('sale')) return "bg-red-100 text-red-800";
    if (type.includes('exchange')) return "bg-purple-100 text-purple-800";
    return "bg-blue-100 text-blue-800";
  };

  const getPartyColor = (party: string) => {
    if (!party) return "bg-gray-100 text-gray-800";
    
    party = party.toLowerCase();
    if (party.includes('democrat')) return "bg-blue-100 text-blue-800";
    if (party.includes('republican')) return "bg-red-100 text-red-800";
    if (party.includes('independent')) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  if (loading && trades.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Political Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Input 
                placeholder="Search by politician or stock" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            <div>
              <Select value={party} onValueChange={setParty}>
                <SelectTrigger>
                  <SelectValue placeholder="Party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Parties</SelectItem>
                  <SelectItem value="Democrat">Democrat</SelectItem>
                  <SelectItem value="Republican">Republican</SelectItem>
                  <SelectItem value="Independent">Independent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Exchange">Exchange</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button onClick={handleSearch}>Search</Button>
            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Congressional Trading Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No political trades found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("politician_name")}>
                        Politician{renderSortIcon("politician_name")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("party")}>
                        Party{renderSortIcon("party")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("symbol")}>
                        Stock{renderSortIcon("symbol")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("transaction_type")}>
                        Type{renderSortIcon("transaction_type")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("transaction_date")}>
                        Date{renderSortIcon("transaction_date")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("amount_range")}>
                        Amount{renderSortIcon("amount_range")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">
                          {trade.politician_name}
                          <div className="text-xs text-muted-foreground">{trade.politician_office}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPartyColor(trade.party)}>
                            {trade.party || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trade.symbol ? (
                            <div>
                              <span className="font-semibold">{trade.symbol}</span>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {trade.asset_description}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm truncate max-w-[200px]">
                              {trade.asset_description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTransactionTypeColor(trade.transaction_type)}>
                            {trade.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(trade.transaction_date)}</TableCell>
                        <TableCell>{trade.amount_range}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="flex justify-between mt-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 