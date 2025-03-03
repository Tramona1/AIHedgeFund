'use client';
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, RefreshCcw } from 'lucide-react';

interface QueryResponse {
  response: string;
  data?: any;
}

export default function AIQueryInterface() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: 'Query required',
        description: 'Please enter a question to ask about stocks.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      const res = await fetch('/api/ai-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to process query');
      }
      
      const data = await res.json();
      
      if (data.success) {
        setResponse({
          response: data.response,
          data: data.data,
        });
        
        // Add to query history
        setQueryHistory(prev => [query, ...prev.slice(0, 9)]);
      } else {
        throw new Error(data.error || 'Failed to process query');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQueryExample = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ask About Stocks</CardTitle>
          <CardDescription>
            Query our database using natural language to find insights on stocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="e.g. Show me small cap stocks with revenue over $100M but market cap under $500M"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Search
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500 mb-2">Example queries:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Show me small cap stocks with market cap under $300M but revenue over $100M',
                'Which tech stocks have P/E ratio under 15?',
                'Find healthcare companies with highest revenue growth',
                'List stocks with market cap over $10B and revenue under $1B',
              ].map((example, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQueryExample(example)}
                  className="text-xs"
                >
                  {example.length > 40 ? example.substring(0, 40) + '...' : example}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              AI-generated response to your query
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
              {response.response}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-slate-500">
              Data is based on our available financial information. The results may not include all companies or the most recent data.
            </p>
          </CardFooter>
        </Card>
      )}
      
      {queryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {queryHistory.map((q, i) => (
                <li key={i}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left text-sm h-auto py-2"
                    onClick={() => setQuery(q)}
                  >
                    <RefreshCcw className="mr-2 h-3 w-3" />
                    {q}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 