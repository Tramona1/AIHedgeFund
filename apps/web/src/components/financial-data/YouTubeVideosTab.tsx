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

export interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  duration: string;
  categories: string[];
  tickers: string[];
}

export function YouTubeVideosTab() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tickerFilter, setTickerFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [timeFrame, setTimeFrame] = useState<string>("1w");
  
  const timeFrameMap: Record<string, number> = {
    "1d": 1,
    "3d": 3,
    "1w": 7,
    "2w": 14,
    "1m": 30,
    "3m": 90,
    "all": 0
  };

  const channelOptions = [
    "all",
    "cnbc",
    "bloomberg",
    "yahoo-finance",
    "the-motley-fool",
    "meet-kevin",
    "financial-education",
    "andrei-jikh",
    "graham-stephan",
    "unusual-whales"
  ];

  const categoryOptions = [
    "all",
    "market-news",
    "stock-analysis",
    "earnings",
    "economy",
    "crypto",
    "options",
    "personal-finance",
    "investing-strategies"
  ];

  useEffect(() => {
    fetchYouTubeVideos();
  }, [page, channelFilter, categoryFilter, timeFrame, tickerFilter]);

  const fetchYouTubeVideos = async () => {
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
        limit: "12",
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(channelFilter !== "all" && { channel: channelFilter }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(tickerFilter && { ticker: tickerFilter.toUpperCase() }),
      });
      
      const response = await fetchAPI<{ 
        success: boolean; 
        data: YouTubeVideo[]; 
        pagination: { total_pages: number } 
      }>(`/api/financial-data/youtube-videos?${queryParams.toString()}`);
      
      if (response.success) {
        setVideos(response.data);
        setTotalPages(response.pagination.total_pages);
      } else {
        setError("Failed to fetch YouTube videos");
      }
    } catch (err) {
      setError("An error occurred while fetching YouTube videos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = !searchQuery || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.channelTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesSearch;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (duration: string) => {
    // YouTube duration format is like "PT1H2M30S" (1 hour, 2 minutes, 30 seconds)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? `${match[1]}:` : '';
    const minutes = match[2] ? `${match[2]}:` : hours ? '00:' : '0:';
    const seconds = match[3] ? `${match[3].padStart(2, '0')}` : '00';
    
    return `${hours}${minutes}${seconds}`;
  };

  const formatChannelName = (name: string) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  if (loading && page === 1) {
    return <LoadingSkeleton />;
  }

  if (error && !videos.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => fetchYouTubeVideos()}
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
        <CardTitle>YouTube Videos</CardTitle>
        <CardDescription>
          Financial news, analysis, and educational content from top YouTube channels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search videos..."
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
                className="w-28"
              />
              
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="all">All Channels</option>
                {channelOptions.filter(c => c !== "all").map(channel => (
                  <option key={channel} value={channel}>
                    {channel.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="all">All Categories</option>
                {categoryOptions.filter(c => c !== "all").map(category => (
                  <option key={category} value={category}>
                    {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
                <option value="3m">Last 3 months</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => (
                <div key={video.id} className="flex flex-col border rounded-lg overflow-hidden h-full">
                  <div className="aspect-video relative">
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-medium line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {formatChannelName(video.channelTitle)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                      <span>{formatNumber(video.views)} views</span>
                      <span className="mx-1">•</span>
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                    
                    {video.tickers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {video.tickers.slice(0, 5).map(ticker => (
                          <Badge key={ticker} variant="secondary" className="text-xs">
                            {ticker}
                          </Badge>
                        ))}
                        {video.tickers.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{video.tickers.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {video.categories.map(category => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="mt-auto pt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                      >
                        Watch Video
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                {loading ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                  </div>
                ) : (
                  "No videos found matching your criteria"
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col border rounded-lg overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <div className="flex gap-1 mt-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-8 w-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 