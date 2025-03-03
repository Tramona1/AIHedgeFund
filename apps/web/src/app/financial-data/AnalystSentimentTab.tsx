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
import { CalendarIcon, ArrowUpDown, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface AnalystRating {
  id: string;
  symbol: string;
  company_name: string;
  analyst_firm: string;
  analyst_name: string;
  rating: string;
  previous_rating: string;
  rating_change: string;
  price_target: number;
  previous_price_target: number;
  date: string;
  notes: string;
  source: string;
}

export default function AnalystSentimentTab() {
  const [ratings, setRatings] = useState<AnalystRating[]>([]);
  const [filteredRatings, setFilteredRatings] = useState<AnalystRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<keyof AnalystRating>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [firmFilter, setFirmFilter] = useState('');
  const [ratingChangeFilter, setRatingChangeFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const itemsPerPage = 10;
  
  const fetchAnalystRatings = async () => {
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
      
      const response = await axios.get(`/api/financial-data/analyst-ratings?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data.data)) {
        setRatings(response.data.data);
        setFilteredRatings(response.data.data);
        setTotalPages(Math.ceil(response.data.total / itemsPerPage) || 1);
      } else {
        setError('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching analyst ratings:', err);
      setError('Failed to fetch analyst ratings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnalystRatings();
  }, [page, symbolFilter, startDate, endDate]);
  
  useEffect(() => {
    // Filter and sort the ratings
    let result = [...ratings];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        rating => 
          rating.symbol?.toLowerCase().includes(query) ||
          rating.company_name?.toLowerCase().includes(query) ||
          rating.analyst_firm?.toLowerCase().includes(query) ||
          rating.analyst_name?.toLowerCase().includes(query)
      );
    }
    
    // Apply firm filter
    if (firmFilter) {
      result = result.filter(rating => 
        rating.analyst_firm?.toLowerCase().includes(firmFilter.toLowerCase())
      );
    }
    
    // Apply rating change filter
    if (ratingChangeFilter) {
      result = result.filter(rating => 
        rating.rating_change?.toLowerCase() === ratingChangeFilter.toLowerCase()
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      
      if (sortField === 'price_target' || sortField === 'previous_price_target') {
        const numA = Number(valueA) || 0;
        const numB = Number(valueB) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      return 0;
    });
    
    setFilteredRatings(result);
  }, [ratings, searchQuery, firmFilter, ratingChangeFilter, sortField, sortDirection]);
  
  const handleSort = (field: keyof AnalystRating) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getRatingChangeColor = (change: string) => {
    if (!change) return 'bg-gray-100 text-gray-800';
    
    switch (change.toLowerCase()) {
      case 'upgrade':
        return 'bg-green-100 text-green-800';
      case 'downgrade':
        return 'bg-red-100 text-red-800';
      case 'initiate':
      case 'initiated':
        return 'bg-blue-100 text-blue-800';
      case 'maintain':
      case 'maintained':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatCurrency = (value: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const getPriceTargetChange = (current: number, previous: number) => {
    if (!previous || !current) return null;
    
    const change = ((current - previous) / previous) * 100;
    const formattedChange = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
    
    if (change > 0) {
      return <span className="text-green-600 flex items-center"><TrendingUp className="h-4 w-4 mr-1" />{formattedChange}</span>;
    } else if (change < 0) {
      return <span className="text-red-600 flex items-center"><TrendingDown className="h-4 w-4 mr-1" />{formattedChange}</span>;
    } else {
      return <span className="text-gray-600">{formattedChange}</span>;
    }
  };
  
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading analyst ratings...</span>
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
            onClick={fetchAnalystRatings} 
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
        <h2 className="text-2xl font-bold mb-4">Analyst Ratings</h2>
        <p className="text-muted-foreground mb-4">
          Track analyst upgrades, downgrades, and price target changes from major research firms.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Input
              placeholder="Search by symbol, company, or analyst"
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
              placeholder="Filter by analyst firm"
              value={firmFilter}
              onChange={(e) => setFirmFilter(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div>
            <Select
              value={ratingChangeFilter}
              onValueChange={setRatingChangeFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Rating change" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Changes</SelectItem>
                <SelectItem value="upgrade">Upgrade</SelectItem>
                <SelectItem value="downgrade">Downgrade</SelectItem>
                <SelectItem value="initiate">Initiate</SelectItem>
                <SelectItem value="maintain">Maintain</SelectItem>
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
              <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('symbol')}>
                Symbol
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('analyst_firm')}>
                Firm
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('rating_change')}>
                Change
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('rating')}>
                Rating
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('price_target')}>
                Price Target
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('previous_price_target')}>
                Previous Target
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">
                % Change
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                Date
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRatings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No analyst ratings found
                </TableCell>
              </TableRow>
            ) : (
              filteredRatings.map((rating) => (
                <TableRow key={rating.id}>
                  <TableCell className="font-medium">
                    {rating.symbol}
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {rating.company_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {rating.analyst_firm}
                    {rating.analyst_name && (
                      <div className="text-xs text-muted-foreground">
                        {rating.analyst_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRatingChangeColor(rating.rating_change)}>
                      {rating.rating_change || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{rating.rating || 'N/A'}</span>
                      {rating.previous_rating && (
                        <span className="text-xs text-muted-foreground">
                          From: {rating.previous_rating}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(rating.price_target)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(rating.previous_price_target)}
                  </TableCell>
                  <TableCell className="text-right">
                    {getPriceTargetChange(rating.price_target, rating.previous_price_target)}
                  </TableCell>
                  <TableCell>
                    {new Date(rating.date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredRatings.length} of {ratings.length} analyst ratings
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