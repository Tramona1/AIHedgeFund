"use client";

import React, { useEffect, useState } from 'react';
import { interviewsAPI, Interview } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Play, FileText } from 'lucide-react';
import Link from 'next/link';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    speaker: string | null;
  }>({
    speaker: null
  });
  const [speakers, setSpeakers] = useState<string[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const fetchSpeakers = async () => {
    try {
      const data = await interviewsAPI.getSpeakers();
      setSpeakers(data.data || []);
    } catch (err) {
      console.error('Error fetching speakers:', err);
    }
  };

  const fetchInterviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data;
      if (filter.speaker) {
        data = await interviewsAPI.getBySpeaker(filter.speaker);
      } else {
        data = await interviewsAPI.getRecent(20); // Get more interviews for the full page
      }
      setInterviews(data.data || []);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError('Failed to load interviews. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
    fetchInterviews();
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [filter.speaker]);

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Expert Interviews</h1>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium mb-1">Speaker</label>
              <select
                className="w-full rounded-md border border-gray-300 p-2"
                value={filter.speaker || ''}
                onChange={(e) => setFilter({ 
                  ...filter, 
                  speaker: e.target.value || null
                })}
              >
                <option value="">All Speakers</option>
                {speakers.map((speaker) => (
                  <option key={speaker} value={speaker}>{speaker}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilter({ speaker: null })}
                disabled={!filter.speaker}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interviews List */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i} className="shadow-md">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchInterviews}>Retry</Button>
            </CardContent>
          </Card>
        ) : interviews.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <p className="text-lg font-medium mb-2">No interviews found</p>
              <p className="text-gray-500 mb-4">
                {filter.speaker
                  ? "Try changing or clearing your filters"
                  : "Check back later for new expert interviews"}
              </p>
              {filter.speaker && (
                <Button onClick={() => setFilter({ speaker: null })}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          interviews.map((interview) => (
            <Card key={interview.id} className="shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3">{interview.title}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {interview.speaker}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(interview.timestamp)}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {interview.summary}
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button size="sm" className="flex items-center gap-1" asChild>
                    <a href={interview.video_url} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4" /> Watch Video
                    </a>
                  </Button>
                  
                  {interview.transcript_url && (
                    <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                      <a href={interview.transcript_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4" /> Read Transcript
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 