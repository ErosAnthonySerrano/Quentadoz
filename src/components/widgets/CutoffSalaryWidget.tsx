'use client'

import React from 'react'
import type { Cutoff } from '@/types'
import { formatCurrency, formatDate, ordinalLabel } from '@/utils/budget'

interface Props {
  cutoffs: Cutoff[]
}

export function CutoffSalaryWidget({ cutoffs }: Props) {
  return (
    <div className="bg-card rounded-lg shadow-md shadow-black/20 border border-line p-6">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
        Cutoff Salary Overview
      </h3>
      <div className="flex flex-wrap gap-3">
        {cutoffs.map((c) => (
          <div key={c.id} className="flex flex-col gap-1 p-4 bg-surface rounded-md flex-1 basis-36 shadow-sm border border-line">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">
              {ordinalLabel(c.cutoff_number)}
            </span>
            <span className="text-xs text-muted">{formatDate(c.date)}</span>
            <span className="text-xl font-semibold text-accent mt-1">
              {formatCurrency(c.salary)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

