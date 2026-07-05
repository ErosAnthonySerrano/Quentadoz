'use client'

import React from 'react'
import type { Cutoff } from '@/types'
import { formatCurrency, ordinalLabel } from '@/utils/budget'
import { HiCalendarDays } from 'react-icons/hi2'

interface Props {
  cutoffs: Cutoff[]
}

export function CutoffOverviewWidget({ cutoffs }: Props) {
  const sortedCutoffs = [...cutoffs].sort((a, b) => a.cutoff_number - b.cutoff_number)
  
  // Determine grid columns based on cutoff count for desktop
  const getGridColsClass = () => {
    const count = sortedCutoffs.length
    if (count <= 2) return 'md:grid-cols-2'
    if (count <= 3) return 'md:grid-cols-3'
    if (count <= 4) return 'md:grid-cols-4'
    if (count <= 5) return 'md:grid-cols-5'
    return 'md:grid-cols-6'
  }

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Cutoff Overview
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-accent">{sortedCutoffs.length} cutoffs</span>
          <div className="dashboard-chip w-8 h-8 rounded-lg text-accent flex items-center justify-center">
            <HiCalendarDays size={16} />
          </div>
        </div>
      </div>

      {/* Mobile: Grid 3 columns, Desktop: Responsive grid */}
      <div className="relative w-full">
        {/* Connection line - only visible on desktop grid */}
        <div className="hidden md:block absolute left-0 right-0 h-0.5 bg-line top-6 z-0" />

        {/* Mobile: 3 column grid */}
        <div className="md:hidden grid grid-cols-3 gap-4 w-full">
          {sortedCutoffs.map((cutoff) => (
            <div
              key={cutoff.id}
              className="flex flex-col items-center"
            >
              {/* Node circle */}
              <div className="w-10 h-10 rounded-full bg-page border-2 border-accent flex items-center justify-center mb-3 shrink-0">
                <span className="text-xs font-semibold text-accent">
                  {cutoff.cutoff_number}
                </span>
              </div>

              {/* Cutoff details - condensed for mobile */}
              <div className="text-center min-w-0">
                <div className="text-[10px] font-semibold text-body mb-0.5 truncate">
                  {ordinalLabel(cutoff.cutoff_number)}
                </div>
                <div className="text-[9px] text-accent font-semibold">
                  {formatCurrency(cutoff.salary)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Dynamic grid layout */}
        <div className={`hidden md:grid ${getGridColsClass()} gap-4 w-full`}>
          {sortedCutoffs.map((cutoff) => (
            <div
              key={cutoff.id}
              className="flex flex-col items-center relative z-10"
            >
              {/* Node circle */}
              <div className="w-12 h-12 rounded-full bg-page border-2 border-accent flex items-center justify-center mb-4">
                <span className="text-sm font-semibold text-accent">
                  {cutoff.cutoff_number}
                </span>
              </div>

              {/* Cutoff details */}
              <div className="text-center">
                <div className="text-xs font-semibold text-body mb-0.5">
                  {ordinalLabel(cutoff.cutoff_number)}
                </div>
                <div className="text-xs text-muted mb-2">
                  {new Date(cutoff.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-sm font-semibold text-accent">
                  {formatCurrency(cutoff.salary)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

