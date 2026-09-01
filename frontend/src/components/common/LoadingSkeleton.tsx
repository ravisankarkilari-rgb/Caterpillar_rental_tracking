import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  type?: 'table' | 'cards' | 'dashboard';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 5, type = 'table' }) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-800/60 rounded-xl border border-gray-800"></div>
        ))}
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-800/60 rounded-xl border border-gray-800"></div>
          ))}
        </div>
        <div className="h-44 bg-gray-800/40 rounded-xl border border-gray-800"></div>
        <div className="h-96 bg-gray-800/40 rounded-xl border border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-10 bg-gray-800/70 rounded-lg w-full"></div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-800/40 rounded-lg w-full"></div>
      ))}
    </div>
  );
};
