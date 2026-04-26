'use client'

import React from 'react'
import { HiOutlineExclamationTriangle } from 'react-icons/hi2'
import { ordinalLabel } from '@/utils/budget'

interface AIOutOfRangeModalProps {
  isOpen: boolean
  outOfRangeCount: number
  outOfRangeCutoffs: number[]
  totalCutoffs: number
  fallbackLabel: string
  onAddAll: () => void
  onDiscard: () => void
}

export function AIOutOfRangeModal({
  isOpen,
  outOfRangeCount,
  outOfRangeCutoffs,
  totalCutoffs,
  fallbackLabel,
  onAddAll,
  onDiscard,
}: AIOutOfRangeModalProps) {
  if (!isOpen) return null

  const cutoffLabels = [...outOfRangeCutoffs].sort((a, b) => a - b).map(ordinalLabel).join(', ')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-md border border-line p-6 w-full max-w-md">
        <div className="flex items-start gap-3 mb-5">
          <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-due-warning-bg flex items-center justify-center">
            <HiOutlineExclamationTriangle size={16} className="text-due-warning" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-header mb-1">
              Some items don&apos;t fit this budget
            </h3>
            <p className="text-sm text-body">
              <span className="font-medium">{outOfRangeCount} item(s)</span> are labeled for{' '}
              <span className="font-medium">{cutoffLabels}</span>, which{' '}
              {outOfRangeCutoffs.length === 1 ? "doesn't exist" : "don't exist"} in this{' '}
              {totalCutoffs}-cutoff budget. What would you like to do?
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onAddAll}
            className="w-full px-4 py-3 rounded-md text-sm font-medium bg-surface text-body border border-line hover:bg-accent-light hover:text-accent hover:border-accent transition-colors text-left"
          >
            Add all to <span className="font-semibold">{fallbackLabel}</span>
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="w-full px-4 py-3 rounded-md text-sm font-medium bg-accent text-secondary hover:bg-accent-hover transition-colors text-left"
          >
            Discard out-of-range items
            <span className="block text-xs font-normal mt-0.5 opacity-80">
              Only keep items labeled for {fallbackLabel} or unlabeled
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
