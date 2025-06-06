import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="group bg-white/90 rounded-xl shadow-lg p-6 border border-biblical-gold/20 animate-pulse">
      <div className="flex flex-col h-full">
        {/* Main content area */}
        <div className="flex-grow mb-4">
          {/* Title skeleton */}
          <div className="h-6 bg-parchment/50 rounded mb-3 w-4/5"></div>
          
          {/* Hebrew title skeleton */}
          <div className="h-5 bg-parchment/40 rounded mb-3 w-3/4"></div>
          
          {/* Category breadcrumb skeleton */}
          <div className="mb-3 p-2 bg-parchment/30 rounded-lg">
            <div className="h-4 bg-parchment/50 rounded w-5/6"></div>
          </div>
          
          {/* Metadata skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-parchment/40 rounded w-20"></div>
            <div className="h-4 bg-parchment/40 rounded w-16"></div>
          </div>
        </div>
        
        {/* Action button skeleton */}
        <div className="mt-auto">
          <div className="h-12 bg-parchment/50 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard; 