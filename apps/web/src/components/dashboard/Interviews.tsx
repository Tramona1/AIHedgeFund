"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { interviewsAPI, Interview } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Play, RefreshCw } from 'lucide-react';

interface InterviewsProps {
  limit?: number;
}

export function Interviews({ limit = 3 }: InterviewsProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const fetchInterviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await interviewsAPI.getRecent(limit);
      setInterviews(data.data || []);
    } catch (err: any) {
      console.error('Error fetching interviews:', err);
      let errorMessage = 'Failed to load interviews. Please try again.';
      
      // More specific error handling based on error type
      if (err.message && typeof err.message === 'string') {
        if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to the API server. Please ensure the API is running.';
        } else if (err.message.includes('JSON')) {
          errorMessage = 'Received invalid data from the server. Please try again later.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [limit, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Recent Interviews</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/interviews">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {Array(limit).fill(0).map((_, i) => (
              <div key={i} className="border-b pb-5 last:border-0">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-1" />
                <Skeleton className="h-4 w-5/6 mb-1" />
                <Skeleton className="h-4 w-5/6 mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-500 mb-3">{error}</p>
            <Button 
              onClick={handleRetry} 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews available</h3>
            <p className="text-gray-500">Check back later for new expert interviews and insights.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {interviews.map((interview) => (
              <div key={interview.id} className="border-b pb-5 last:border-0 last:pb-0">
                <h3 className="font-semibold text-lg mb-1">{interview.title}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {interview.speaker}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(interview.timestamp)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
                  {truncateText(interview.summary || 'No summary available')}
                </p>
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm" className="text-xs flex items-center gap-1" asChild>
                    <a href={interview.video_url} target="_blank" rel="noopener noreferrer">
                      <Play className="h-3 w-3" /> Watch Video
                    </a>
                  </Button>
                  {interview.transcript_url && (
                    <Button variant="outline" size="sm" className="text-xs flex items-center gap-1" asChild>
                      <a href={interview.transcript_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" /> View Transcript
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 