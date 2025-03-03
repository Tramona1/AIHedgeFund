import React, { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

/**
 * PageContainer provides a consistent layout wrapper for pages
 */
export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

// Also export as default for compatibility with existing imports
export default PageContainer; 