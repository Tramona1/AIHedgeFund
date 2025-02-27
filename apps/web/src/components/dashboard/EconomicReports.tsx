"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { economicReportsAPI, EconomicReport } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/Badge";

interface EconomicReportsProps {
  limit?: number;
}

export function EconomicReports({ limit = 5 }: EconomicReportsProps) {
  const [reports, setReports] = useState<EconomicReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await economicReportsAPI.getRecent(limit);
      setReports(data.data || []);
    } catch (err) {
      console.error('Error fetching economic reports:', err);
      setError('Failed to load economic reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [limit]);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Economic Reports</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/economic-reports">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(limit).fill(0).map((_, i) => (
              <div key={i} className="border-b pb-4 last:border-0">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-1" />
                <Skeleton className="h-4 w-5/6 mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-500 mb-3">{error}</p>
            <Button onClick={fetchReports} size="sm">Retry</Button>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No economic reports available</h3>
            <p className="text-gray-500">Check back later for new economic reports and analyses.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border-b pb-4 last:border-0 last:pb-0">
                <h3 className="font-semibold text-lg mb-1">{report.subject}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {report.category}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    {report.source}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(report.timestamp)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
                  {report.summary}
                </p>
                {report.url && (
                  <Button variant="outline" size="sm" asChild className="text-xs">
                    <a href={report.url} target="_blank" rel="noopener noreferrer">
                      View Report
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 