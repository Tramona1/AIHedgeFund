import React from 'react';
import { Metadata } from 'next';
// Import commented out as we won't be using this component
// import PortfolioManager from '@/components/portfolio/PortfolioManager';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata: Metadata = {
  title: 'Portfolio Management | AI Hedge Fund',
  description: 'Manage your investment portfolios and track performance',
};

export default function PortfolioPage() {
  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Portfolio Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your investment portfolios in one place. Monitor performance, add positions, and record transactions.
          </p>
        </div>
        
        {/* PortfolioManager component commented out as we won't be using it */}
        {/* <PortfolioManager /> */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Portfolio management features coming soon.
          </p>
        </div>
      </div>
    </PageContainer>
  );
} 