import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI } from "@/lib/api";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from "recharts";

interface AnalystRating {
  firm: string;
  analyst: string;
  rating: string;
  priceTarget: number;
  previousRating?: string;
  previousPriceTarget?: number;
  date: string;
}

interface EarningsData {
  reportDate: string;
  fiscalQuarter: string;
  epsEstimate: number;
  epsActual: number;
  revenueEstimate: number; // in millions
  revenueActual: number; // in millions
  surprise: number; // percentage
}

interface StockSentiment {
  symbol: string;
  companyName: string;
  sector: string;
  analystConsensus: string;
  averagePriceTarget: number;
  highPriceTarget: number;
  lowPriceTarget: number;
  numberOfAnalysts: number;
  upRevisions: number;
  downRevisions: number;
  lastRevisionDate: string;
  analystRatings: AnalystRating[];
  earnings: {
    nextEarningsDate?: string;
    previousEarnings: EarningsData[];
  };
}

export function AnalystSentimentTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [symbol, setSymbol] = useState("");
  const [sentiment, setSentiment] = useState<StockSentiment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setSymbol(searchTerm.toUpperCase());
    setLoading(true);
    setError("");
    
    try {
      const data = await fetchAPI<StockSentiment>(`/api/financial-data/analyst-sentiment?symbol=${searchTerm.toUpperCase()}`);
      setSentiment(data);
    } catch (err) {
      console.error("Error fetching analyst sentiment:", err);
      setError("Failed to load analyst sentiment data. Please try again later.");
      setSentiment(null);
    } finally {
      setLoading(false);
    }
  };
  
  const getConsensusColor = (consensus: string) => {
    const lowerConsensus = consensus.toLowerCase();
    if (lowerConsensus.includes('strong buy') || lowerConsensus.includes('buy')) {
      return "bg-green-100 text-green-800";
    }
    if (lowerConsensus.includes('hold') || lowerConsensus.includes('neutral')) {
      return "bg-yellow-100 text-yellow-800";
    }
    if (lowerConsensus.includes('sell') || lowerConsensus.includes('underperform')) {
      return "bg-red-100 text-red-800";
    }
    return "bg-gray-100 text-gray-800";
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getRatingChangeColor = (current: string, previous?: string) => {
    if (!previous) return "text-gray-800";
    
    const ratingValues: {[key: string]: number} = {
      'strong buy': 5,
      'buy': 4,
      'hold': 3,
      'underperform': 2,
      'sell': 1
    };
    
    const currentLower = current.toLowerCase();
    const previousLower = previous.toLowerCase();
    
    let currentVal = 3; // default to hold
    let previousVal = 3; // default to hold
    
    Object.entries(ratingValues).forEach(([rating, value]) => {
      if (currentLower.includes(rating)) currentVal = value;
      if (previousLower.includes(rating)) previousVal = value;
    });
    
    if (currentVal > previousVal) return "text-green-600";
    if (currentVal < previousVal) return "text-red-600";
    return "text-gray-800";
  };

  const getPriceTargetChangeColor = (current: number, previous?: number) => {
    if (!previous) return "text-gray-800";
    if (current > previous) return "text-green-600";
    if (current < previous) return "text-red-600";
    return "text-gray-800";
  };
  
  const preparePriceTargetChartData = () => {
    if (!sentiment) return [];
    
    const latestRatings = [...sentiment.analystRatings]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .reverse();
    
    return latestRatings.map(rating => ({
      date: formatDate(rating.date),
      priceTarget: rating.priceTarget,
      firm: rating.firm
    }));
  };
  
  const prepareEarningsChartData = () => {
    if (!sentiment?.earnings?.previousEarnings) return [];
    
    return [...sentiment.earnings.previousEarnings]
      .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())
      .map(earning => ({
        quarter: earning.fiscalQuarter,
        epsEstimate: earning.epsEstimate,
        epsActual: earning.epsActual,
        revenueEstimate: earning.revenueEstimate,
        revenueActual: earning.revenueActual,
        surprise: earning.surprise
      }));
  };
  
  const calculateDaysUntilEarnings = () => {
    if (!sentiment?.earnings?.nextEarningsDate) return null;
    
    const today = new Date();
    const earningsDate = new Date(sentiment.earnings.nextEarningsDate);
    const differenceInTime = earningsDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  };
  
  const daysUntilEarnings = calculateDaysUntilEarnings();
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Analyst Ratings & Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input 
              placeholder="Enter stock symbol (e.g., AAPL)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {loading ? (
        <LoadingSkeleton />
      ) : sentiment ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="flex items-center gap-2">
                  {symbol}
                  <span className="text-lg font-normal text-muted-foreground">
                    {sentiment.companyName}
                  </span>
                </CardTitle>
                {sentiment.earnings.nextEarningsDate && (
                  <Badge className={daysUntilEarnings && daysUntilEarnings <= 7 ? "bg-amber-100 text-amber-800" : ""}>
                    Earnings: {formatDate(sentiment.earnings.nextEarningsDate)}
                    {daysUntilEarnings !== null && (
                      <span className="ml-1">
                        ({daysUntilEarnings} {daysUntilEarnings === 1 ? 'day' : 'days'})
                      </span>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Analyst Consensus</div>
                  <div className="flex items-center gap-2">
                    <Badge className={getConsensusColor(sentiment.analystConsensus)}>
                      {sentiment.analystConsensus}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({sentiment.numberOfAnalysts} analysts)
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Price Target</div>
                  <div>
                    <div className="font-semibold">{formatCurrency(sentiment.averagePriceTarget)}</div>
                    <div className="text-xs text-muted-foreground">
                      Range: {formatCurrency(sentiment.lowPriceTarget)} - {formatCurrency(sentiment.highPriceTarget)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Recent Revisions</div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-green-600 font-semibold">▲ {sentiment.upRevisions}</span>
                      <div className="text-xs text-muted-foreground">Upgrades</div>
                    </div>
                    <div>
                      <span className="text-red-600 font-semibold">▼ {sentiment.downRevisions}</span>
                      <div className="text-xs text-muted-foreground">Downgrades</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="text-sm font-medium text-muted-foreground mb-4">Price Target Trend</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={preparePriceTargetChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip 
                        formatter={(value: any, name: any, props: any) => [
                          `$${value}`, 
                          'Price Target',
                          props.payload.firm
                        ]}
                      />
                      <Line type="monotone" dataKey="priceTarget" stroke="#4f46e5" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-4">Latest Analyst Ratings</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firm</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analyst</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Target</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sentiment.analystRatings
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10)
                        .map((rating, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rating.firm}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rating.analyst}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={getRatingChangeColor(rating.rating, rating.previousRating)}>
                                {rating.rating}
                                {rating.previousRating && rating.rating !== rating.previousRating && (
                                  <span className="text-xs ml-1">
                                    (from {rating.previousRating})
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={getPriceTargetChangeColor(rating.priceTarget, rating.previousPriceTarget)}>
                                {formatCurrency(rating.priceTarget)}
                                {rating.previousPriceTarget && rating.priceTarget !== rating.previousPriceTarget && (
                                  <span className="text-xs ml-1">
                                    (from {formatCurrency(rating.previousPriceTarget)})
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(rating.date)}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {sentiment.earnings.previousEarnings && sentiment.earnings.previousEarnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-sm font-medium text-muted-foreground mb-4">EPS vs Estimates</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prepareEarningsChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quarter" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, '']} />
                        <Legend />
                        <Bar dataKey="epsEstimate" name="EPS Estimate" fill="#94a3b8" />
                        <Bar dataKey="epsActual" name="EPS Actual" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-sm font-medium text-muted-foreground mb-4">Revenue vs Estimates (in millions)</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prepareEarningsChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quarter" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`$${formatNumber(value)} M`, '']} />
                        <Legend />
                        <Bar dataKey="revenueEstimate" name="Revenue Estimate" fill="#94a3b8" />
                        <Bar dataKey="revenueActual" name="Revenue Actual" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-4">Earnings Surprise (%)</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prepareEarningsChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quarter" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`${value.toFixed(2)}%`, 'Surprise']} />
                        <ReferenceLine y={0} stroke="#000" />
                        <Bar dataKey="surprise" name="Earnings Surprise" fill={`#4f46e5`} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Enter a stock symbol above to view analyst ratings and earnings data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
          
          <div className="mb-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
          
          <div>
            <Skeleton className="h-4 w-48 mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="mb-6">
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 