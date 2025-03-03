'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { CalendarIcon, ArrowUpDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface PoliticalTrade {
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

export default function PoliticalTradesTab() {
  const [politicalTrades, setPoliticalTrades] = useState<PoliticalTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<PoliticalTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<keyof PoliticalTrade>('transaction_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const itemsPerPage = 10;
  
  const fetchPoliticalTrades = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (symbolFilter) {
        params.append('symbols', symbolFilter);
      }
      
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      }
      
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      }
      
      const response = await axios.get(`/api/financial-data/political-trades?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data.data)) {
        setPoliticalTrades(response.data.data);
        setFilteredTrades(response.data.data);
        setTotalPages(Math.ceil(response.data.total / itemsPerPage) || 1);
      } else {
        setError('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching political trades:', err);
      setError('Failed to fetch political trades. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPoliticalTrades();
  }, [page, symbolFilter, startDate, endDate]);
  
  useEffect(() => {
    // Filter and sort the trades
    let result = [...politicalTrades];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        trade => 
          trade.symbol?.toLowerCase().includes(query) ||
          trade.politician_name.toLowerCase().includes(query) ||
          trade.asset_description?.toLowerCase().includes(query)
      );
    }
    
    // Apply party filter
    if (partyFilter) {
      result = result.filter(trade => trade.party === partyFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      return 0;
    });
    
    setFilteredTrades(result);
  }, [politicalTrades, searchQuery, partyFilter, sortField, sortDirection]);
  
  const handleSort = (field: keyof PoliticalTrade) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getPartyColor = (party: string) => {
    switch (party.toLowerCase()) {
      case 'democrat':
      case 'democratic':
        return 'bg-blue-100 text-blue-800';
      case 'republican':
        return 'bg-red-100 text-red-800';
      case 'independent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getTransactionTypeColor = (type: string) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    
    switch (type.toLowerCase()) {
      case 'purchase':
      case 'buy':
        return 'bg-green-100 text-green-800';
      case 'sale':
      case 'sell':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading political trades...</span>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <Button 
            onClick={fetchPoliticalTrades} 
            variant="outline" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Political Trades</h2>
        <p className="text-muted-foreground mb-4">
          Track stock and asset transactions made by members of Congress and other government officials.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Input
              placeholder="Search by politician, symbol, or asset"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <Input
              placeholder="Filter by symbol (e.g., AAPL, MSFT)"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <Select
              value={partyFilter}
              onValueChange={setPartyFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Parties</SelectItem>
                <SelectItem value="Democratic">Democratic</SelectItem>
                <SelectItem value="Republican">Republican</SelectItem>
                <SelectItem value="Independent">Independent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex items-center">
            <span className="mr-2">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
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
          
          <div className="flex items-center">
            <span className="mr-2">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
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
          
          <Button variant="outline" onClick={() => {
            setStartDate(undefined);
            setEndDate(undefined);
          }}>
            Clear Dates
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort('politician_name')}>
                Politician
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('party')}>
                Party
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('symbol')}>
                Symbol/Asset
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('transaction_type')}>
                Type
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('transaction_date')}>
                Date
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('amount_range')}>
                Amount Range
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('filing_date')}>
                Filed
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No political trades found
                </TableCell>
              </TableRow>
            ) : (
              filteredTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">
                    {trade.politician_name}
                    <div className="text-xs text-muted-foreground">
                      {trade.politician_office}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPartyColor(trade.party)}>
                      {trade.party}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {trade.symbol ? (
                      <span className="font-medium">{trade.symbol}</span>
                    ) : (
                      <span className="italic text-muted-foreground">No symbol</span>
                    )}
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {trade.asset_description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTransactionTypeColor(trade.transaction_type)}>
                      {trade.transaction_type || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {trade.transaction_date ? new Date(trade.transaction_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {trade.amount_range || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {trade.filing_date ? new Date(trade.filing_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredTrades.length} of {politicalTrades.length} political trades
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
} 