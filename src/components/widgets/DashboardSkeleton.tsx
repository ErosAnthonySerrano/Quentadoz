'use client'

import React from 'react'

function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded-sm animate-pulse ${className}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-card p-6">
          <SkeletonBox className="h-3 w-2/5 mb-4" />
          <div className="flex gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex-1 flex flex-col gap-2 p-4 bg-surface rounded-md">
                <SkeletonBox className="h-2.5 w-3/5" />
                <SkeletonBox className="h-2.5 w-4/5" />
                <SkeletonBox className="h-5 w-3/4 mt-1" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-card p-6">
          <SkeletonBox className="h-3 w-1/3 mb-4" />
          <div className="flex gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex-1 flex flex-col gap-2">
                <SkeletonBox className="h-2.5 w-1/2" />
                <SkeletonBox className="h-7 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg shadow-card p-6">
        <SkeletonBox className="h-3 w-1/5 mb-4" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonBox key={i} className="h-10" />)}
        </div>
      </div>
      <div className="bg-card rounded-lg shadow-card p-6">
        <SkeletonBox className="h-3 w-1/4 mb-4" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <SkeletonBox key={i} className="h-9" />)}
        </div>
      </div>
    </div>
  )
}

