'use client'

import React, { useState } from 'react'
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2'
import { ordinalLabel } from '@/utils/budget'

interface AICutoffPickerModalProps {
  isOpen: boolean
  itemCount: number
  totalCutoffs: number
  onConfirm: (cutoffIndex: number) => void
  onCancel: () => void
}

export function AICutoffPickerModal({
  isOpen,
  itemCount,
  totalCutoffs,
  onConfirm,
  onCancel,
}: AICutoffPickerModalProps) {
  const [selected, setSelected] = useState(0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-card p-6 w-full max-w-sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
            <HiOutlineQuestionMarkCircle size={16} className="text-accent" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-header mb-1">
              Where should these items go?
            </h3>
            <p className="text-sm text-body">
              Found <span className="font-medium">{itemCount} item(s)</span> but no cutoff sections were detected in the document. Choose which cutoff to add them to.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {Array.from({ length: totalCutoffs }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={[
                'w-full px-4 py-3 rounded-md text-sm font-medium border transition-colors text-left',
                selected === i
                  ? 'bg-accent-light text-accent border-accent'
                  : 'bg-surface text-body border-line hover:border-accent hover:text-accent',
              ].join(' ')}
            >
              {ordinalLabel(i + 1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-body border border-line bg-surface hover:bg-card transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Add to {ordinalLabel(selected + 1)}
          </button>
        </div>
      </div>
    </div>
  )
}
