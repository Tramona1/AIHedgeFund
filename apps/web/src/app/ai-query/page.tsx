import React from 'react';
import { Metadata } from 'next';
import AIQueryInterface from '@/components/ai-query/AIQueryInterface';
import PageContainer from '@/components/layout/PageContainer';

export const metadata: Metadata = {
  title: 'AI Stock Query | AI Hedge Fund',
  description: 'Ask questions about stocks and get AI-powered insights and answers',
};

export default function AIQueryPage() {
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">AI Stock Query</h1>
        <p className="text-slate-600 mb-8">
          Ask any question about stocks and our AI will analyze our database to provide insights
        </p>
        
        <AIQueryInterface />
      </div>
    </PageContainer>
  );
} 