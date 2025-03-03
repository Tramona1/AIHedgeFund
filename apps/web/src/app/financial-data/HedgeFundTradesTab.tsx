'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowUpDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface HedgeFundTrade {
  id: string;
  fund_name: string;
  fund_manager: string;
  cik: string;
  symbol: string;
  company_name: string;
  cusip: string;
  shares: number;
  position_value: number;
  previous_shares: number;
  change_type: string;
  percent_change: number;
  filing_date: string;
  quarter_end_date: string;
  source: string;
}

export default function HedgeFundTradesTab() {
  const [hedgeFundTrades, setHedgeFundTrades] = useState<HedgeFundTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<HedgeFundTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<keyof HedgeFundTrade>('filing_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [fundFilter, setFundFilter] = useState('');
  const [changeTypeFilter, setChangeTypeFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const itemsPerPage = 10;
  
  const fetchHedgeFundTrades = async () => {
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
      
      const response = await axios.get(`/api/financial-data/hedge-fund-trades?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data.data)) {
        setHedgeFundTrades(response.data.data);
        setFilteredTrades(response.data.data);
        setTotalPages(Math.ceil(response.data.total / itemsPerPage) || 1);
      } else {
        setError('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching hedge fund trades:', err);
      setError('Failed to fetch hedge fund trades. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHedgeFundTrades();
  }, [page, symbolFilter, startDate, endDate]);
  
  useEffect(() => {
    // Filter and sort the trades
    let result = [...hedgeFundTrades];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        trade => 
          trade.symbol?.toLowerCase().includes(query) ||
          trade.fund_name?.toLowerCase().includes(query) ||
          trade.company_name?.toLowerCase().includes(query)
      );
    }
    
    // Apply fund filter
    if (fundFilter) {
      result = result.filter(trade => 
        trade.fund_name?.toLowerCase().includes(fundFilter.toLowerCase())
      );
    }
    
    // Apply change type filter
    if (changeTypeFilter) {
      result = result.filter(trade => trade.change_type === changeTypeFilter);
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
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      return 0;
    });
    
    setFilteredTrades(result);
  }, [hedgeFundTrades, searchQuery, fundFilter, changeTypeFilter, sortField, sortDirection]);
  
  const handleSort = (field: keyof HedgeFundTrade) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getChangeTypeColor = (type: string) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    
    switch (type.toLowerCase()) {
      case 'new':
      case 'increase':
        return 'bg-green-100 text-green-800';
      case 'decrease':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold out':
      case 'exit':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatLargeNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toString();
  };
  
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading hedge fund trades...</span>
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
            onClick={fetchHedgeFundTrades} 
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
        <h2 className="text-2xl font-bold mb-4">Hedge Fund Trades</h2>
        <p className="text-muted-foreground mb-4">
          Track position changes from major hedge funds based on 13F filings.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Input
              placeholder="Search by fund, symbol, or company"
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
            <Input
              placeholder="Filter by fund name"
              value={fundFilter}
              onChange={(e) => setFundFilter(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div>
            <Select
              value={changeTypeFilter}
              onValueChange={setChangeTypeFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Position change" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Change Types</SelectItem>
                <SelectItem value="New">New Position</SelectItem>
                <SelectItem value="Increase">Increased</SelectItem>
                <SelectItem value="Decrease">Decreased</SelectItem>
                <SelectItem value="Exit">Exited Position</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
              <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort('fund_name')}>
                Fund
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('symbol')}>
                Symbol
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('change_type')}>
                Change
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('shares')}>
                Current Shares
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('previous_shares')}>
                Previous Shares
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('percent_change')}>
                % Change
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('position_value')}>
                Position Value
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('filing_date')}>
                Filing Date
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No hedge fund trades found
                </TableCell>
              </TableRow>
            ) : (
              filteredTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">
                    {trade.fund_name}
                    <div className="text-xs text-muted-foreground">
                      {trade.fund_manager}
                    </div>
                  </TableCell>
                  <TableCell>
                    {trade.symbol}
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {trade.company_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getChangeTypeColor(trade.change_type)}>
                      {trade.change_type || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatLargeNumber(trade.shares)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatLargeNumber(trade.previous_shares)}
                  </TableCell>
                  <TableCell className="text-right">
                    {trade.percent_change ? formatPercentage(trade.percent_change) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(trade.position_value)}
                  </TableCell>
                  <TableCell>
                    {new Date(trade.filing_date).toLocaleDateString()}
                    <div className="text-xs text-muted-foreground">
                      Q/E: {new Date(trade.quarter_end_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredTrades.length} of {hedgeFundTrades.length} hedge fund trades
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