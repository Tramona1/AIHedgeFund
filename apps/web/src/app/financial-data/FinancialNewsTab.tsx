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
import { CalendarIcon, ArrowUpDown, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface FinancialNews {
  id: string;
  title: string;
  url: string;
  source: string;
  content: string;
  summary: string;
  publish_date: string;
  sentiment: string;
  symbols: string[];
  topics: string[];
}

export default function FinancialNewsTab() {
  const [news, setNews] = useState<FinancialNews[]>([]);
  const [filteredNews, setFilteredNews] = useState<FinancialNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<keyof FinancialNews>('publish_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const itemsPerPage = 10;
  
  const fetchNews = async () => {
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
      
      const response = await axios.get(`/api/financial-data/financial-news?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data.data)) {
        setNews(response.data.data);
        setFilteredNews(response.data.data);
        setTotalPages(Math.ceil(response.data.total / itemsPerPage) || 1);
      } else {
        setError('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching financial news:', err);
      setError('Failed to fetch financial news. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNews();
  }, [page, symbolFilter, startDate, endDate]);
  
  useEffect(() => {
    // Filter and sort the news
    let result = [...news];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item => 
          item.title?.toLowerCase().includes(query) ||
          item.summary?.toLowerCase().includes(query) ||
          item.content?.toLowerCase().includes(query) ||
          (item.symbols && item.symbols.some(symbol => symbol.toLowerCase().includes(query)))
      );
    }
    
    // Apply source filter
    if (sourceFilter) {
      result = result.filter(item => 
        item.source?.toLowerCase() === sourceFilter.toLowerCase()
      );
    }
    
    // Apply sentiment filter
    if (sentimentFilter) {
      result = result.filter(item => 
        item.sentiment?.toLowerCase() === sentimentFilter.toLowerCase()
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      if (sortField === 'publish_date') {
        return sortDirection === 'asc' 
          ? new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime()
          : new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime();
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      return 0;
    });
    
    setFilteredNews(result);
  }, [news, searchQuery, sourceFilter, sentimentFilter, sortField, sortDirection]);
  
  const handleSort = (field: keyof FinancialNews) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getSentimentColor = (sentiment: string) => {
    if (!sentiment) return 'bg-gray-100 text-gray-800';
    
    switch (sentiment.toLowerCase()) {
      case 'positive':
      case 'bullish':
        return 'bg-green-100 text-green-800';
      case 'negative':
      case 'bearish':
        return 'bg-red-100 text-red-800';
      case 'neutral':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading financial news...</span>
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
            onClick={fetchNews} 
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
        <h2 className="text-2xl font-bold mb-4">Financial News</h2>
        <p className="text-muted-foreground mb-4">
          Access the latest financial news with AI-generated summaries and sentiment analysis.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Input
              placeholder="Search news by title, content, or symbols"
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
              value={sentimentFilter}
              onValueChange={setSentimentFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div>
            <Select
              value={sourceFilter}
              onValueChange={setSourceFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="News source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                <SelectItem value="bloomberg">Bloomberg</SelectItem>
                <SelectItem value="reuters">Reuters</SelectItem>
                <SelectItem value="wsj">Wall Street Journal</SelectItem>
                <SelectItem value="cnbc">CNBC</SelectItem>
                <SelectItem value="financial-times">Financial Times</SelectItem>
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
      
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="text-center py-8 border rounded-md">
            <p className="text-muted-foreground">No financial news found</p>
          </div>
        ) : (
          filteredNews.map((item) => (
            <div key={item.id} className="border p-4 rounded-md">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-medium text-lg">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {item.title}
                      <ExternalLink className="inline-block ml-1 h-3 w-3" />
                    </a>
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-muted-foreground">
                      {item.source}
                    </span>
                    <span>•</span>
                    <span className="text-muted-foreground">
                      {new Date(item.publish_date).toLocaleDateString()}
                    </span>
                    {item.sentiment && (
                      <>
                        <span>•</span>
                        <Badge className={getSentimentColor(item.sentiment)}>
                          {item.sentiment}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-2">
                <p className="text-muted-foreground">
                  {truncateText(item.summary || item.content, 300)}
                </p>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {item.symbols && item.symbols.map((symbol, index) => (
                  <Badge key={index} variant="outline" className="bg-gray-50">
                    {symbol}
                  </Badge>
                ))}
                
                {item.topics && item.topics.map((topic, index) => (
                  <Badge key={`topic-${index}`} variant="outline" className="bg-blue-50 text-blue-800">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {filteredNews.length} of {news.length} news articles
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