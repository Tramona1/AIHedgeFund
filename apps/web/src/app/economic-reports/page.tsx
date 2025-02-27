"use client";

import React, { useEffect, useState } from 'react';
import { economicReportsAPI, EconomicReport } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Download } from 'lucide-react';
import Link from 'next/link';

export default function EconomicReportsPage() {
  const [reports, setReports] = useState<EconomicReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    source: string | null;
    category: string | null;
  }>({
    source: null,
    category: null,
  });
  const [sources, setSources] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const fetchFilters = async () => {
    try {
      const [sourcesData, categoriesData] = await Promise.all([
        economicReportsAPI.getSources(),
        economicReportsAPI.getCategories()
      ]);
      setSources(sourcesData.data || []);
      setCategories(categoriesData.data || []);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data;
      if (filter.source) {
        data = await economicReportsAPI.getBySource(filter.source);
      } else if (filter.category) {
        data = await economicReportsAPI.getByCategory(filter.category);
      } else {
        data = await economicReportsAPI.getRecent(20); // Get more reports for the full page
      }
      setReports(data.data || []);
    } catch (err) {
      console.error('Error fetching economic reports:', err);
      setError('Failed to load economic reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchReports();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filter.source, filter.category]);

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Economic Reports</h1>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium mb-1">Source</label>
              <select
                className="w-full rounded-md border border-gray-300 p-2"
                value={filter.source || ''}
                onChange={(e) => setFilter({ 
                  ...filter, 
                  source: e.target.value || null,
                  category: null // Reset other filter
                })}
              >
                <option value="">All Sources</option>
                {sources.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="w-full rounded-md border border-gray-300 p-2"
                value={filter.category || ''}
                onChange={(e) => setFilter({ 
                  ...filter, 
                  category: e.target.value || null,
                  source: null // Reset other filter
                })}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilter({ source: null, category: null })}
                disabled={!filter.source && !filter.category}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i} className="shadow-md">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex">
                  <Skeleton className="h-9 w-28" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchReports}>Retry</Button>
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <p className="text-lg font-medium mb-2">No economic reports found</p>
              <p className="text-gray-500 mb-4">
                {filter.source || filter.category
                  ? "Try changing or clearing your filters"
                  : "Check back later for new economic reports"}
              </p>
              {(filter.source || filter.category) && (
                <Button onClick={() => setFilter({ source: null, category: null })}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3">{report.subject}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {report.category}
                  </span>
                  <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    {report.source}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(report.timestamp)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {report.summary}
                </p>
                <div className="flex flex-wrap gap-3">
                  {report.url && (
                    <Button size="sm" className="flex items-center gap-1" asChild>
                      <a href={report.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" /> View Original
                      </a>
                    </Button>
                  )}
                  {report.file_url && (
                    <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                      <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" /> Download Report
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