'use client'

import React from 'react'
import type { Cutoff } from '@/types'
import { formatCurrency, formatDate, ordinalLabel } from '@/utils/budget'
import { RiCalendarScheduleLine } from 'react-icons/ri'

interface Props {
  cutoffs: Cutoff[]
}

export function CutoffSalaryWidget({ cutoffs }: Props) {
  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Cutoff Salary Overview
        </h3>
        <div className="dashboard-chip w-8 h-8 rounded-lg text-accent flex items-center justify-center">
          <RiCalendarScheduleLine size={14} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cutoffs.map((c) => (
          <div key={c.id} className="dashboard-chip flex flex-col gap-1 p-4 rounded-md min-w-0">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">
              {ordinalLabel(c.cutoff_number)}
            </span>
            <span className="text-xs text-muted">{formatDate(c.date)}</span>
            <span className="text-2xl sm:text-3xl font-semibold text-accent mt-1 leading-none break-all">
              {formatCurrency(c.salary)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

