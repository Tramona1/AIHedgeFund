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
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI } from "@/lib/api";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  tickers: string[];
}

export function FinancialNewsTab() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [tickerFilter, setTickerFilter] = useState<string>("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [timeFrame, setTimeFrame] = useState<string>("1d");
  
  const timeFrameMap: Record<string, number> = {
    "1d": 1,
    "3d": 3,
    "1w": 7,
    "2w": 14,
    "1m": 30,
    "all": 0
  };

  const topicOptions = [
    "all",
    "earnings",
    "market-news",
    "economy",
    "stocks",
    "crypto",
    "forex",
    "commodities",
    "technology",
    "healthcare",
    "finance",
    "politics"
  ];

  const sourceOptions = [
    "all",
    "bloomberg",
    "cnbc",
    "reuters",
    "wsj",
    "financial-times",
    "seeking-alpha",
    "yahoo-finance",
    "barrons",
    "unusual-whales"
  ];

  useEffect(() => {
    fetchNews();
  }, [page, topicFilter, sentimentFilter, sourceFilter, timeFrame, tickerFilter]);

  const fetchNews = async () => {
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
        limit: "15",
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(topicFilter !== "all" && { topic: topicFilter }),
        ...(tickerFilter && { ticker: tickerFilter.toUpperCase() }),
        ...(sentimentFilter !== "all" && { sentiment: sentimentFilter }),
        ...(sourceFilter !== "all" && { source: sourceFilter }),
      });
      
      const response = await fetchAPI<{ 
        success: boolean; 
        data: NewsArticle[]; 
        pagination: { total_pages: number } 
      }>(`/api/financial-data/news?${queryParams.toString()}`);
      
      if (response.success) {
        setNews(response.data);
        setTotalPages(response.pagination.total_pages);
      } else {
        setError("Failed to fetch financial news");
      }
    } catch (err) {
      setError("An error occurred while fetching financial news");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tickers.some(ticker => ticker.toLowerCase().includes(searchQuery.toLowerCase()));
      
    return matchesSearch;
  });

  const getSentimentColor = (sentiment: string) => {
    switch(sentiment) {
      case 'positive':
        return "bg-green-100 text-green-800";
      case 'negative':
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && page === 1) {
    return <LoadingSkeleton />;
  }

  if (error && !news.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => fetchNews()}
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
        <CardTitle>Financial News</CardTitle>
        <CardDescription>
          Stay updated with the latest financial news and market insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-row gap-2 flex-wrap">
              <Input
                placeholder="Filter by ticker..."
                value={tickerFilter}
                onChange={(e) => setTickerFilter(e.target.value.toUpperCase())}
                className="w-32"
              />
              
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="all">All Topics</option>
                {topicOptions.filter(t => t !== "all").map(topic => (
                  <option key={topic} value={topic}>
                    {topic.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="all">All Sentiment</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
              
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="all">All Sources</option>
                {sourceOptions.filter(s => s !== "all").map(source => (
                  <option key={source} value={source}>
                    {source.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                className="border rounded p-2"
              >
                <option value="1d">Last 24 hours</option>
                <option value="3d">Last 3 days</option>
                <option value="1w">Last week</option>
                <option value="2w">Last 2 weeks</option>
                <option value="1m">Last month</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNews.length > 0 ? (
              filteredNews.map((article) => (
                <Card key={article.id} className="flex flex-col h-full">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    {article.imageUrl ? (
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Badge className={getSentimentColor(article.sentiment)}>
                          {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDate(article.publishedAt)}
                        </span>
                      </div>
                      <Badge variant="outline">{article.source}</Badge>
                    </div>
                    <CardTitle className="text-lg mt-2 line-clamp-2">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 flex-grow">
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {article.summary}
                    </p>
                    
                    {article.tickers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {article.tickers.slice(0, 5).map(ticker => (
                          <Badge key={ticker} variant="secondary" className="text-xs">
                            {ticker}
                          </Badge>
                        ))}
                        {article.tickers.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{article.tickers.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0 mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.open(article.url, '_blank')}
                    >
                      Read More
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                {loading ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                  </div>
                ) : (
                  "No news articles found matching your criteria"
                )}
              </div>
            )}
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
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col h-full">
                <Skeleton className="aspect-video w-full" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-6 w-full mt-2" />
                </CardHeader>
                <CardContent className="py-0">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </CardContent>
                <div className="p-4 pt-0 mt-auto">
                  <Skeleton className="h-9 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 