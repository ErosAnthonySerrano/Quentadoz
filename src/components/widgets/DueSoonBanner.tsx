'use client'

import React from 'react'
import { RiAlertLine, RiCloseLine } from 'react-icons/ri'

interface Props {
  count: number
  onDismiss: () => void
}

export function DueSoonBanner({ count, onDismiss }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-md bg-due-danger-bg text-due-danger text-sm font-medium">
      <div className="flex items-center gap-2.5">
        <RiAlertLine size={18} className="shrink-0" />
        <span>
          You have <strong>{count}</strong> bill{count !== 1 ? 's' : ''} due soon. Please review and mark them as paid.
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="flex items-center text-due-danger bg-transparent border-none cursor-pointer shrink-0 p-0.5"
        aria-label="Dismiss"
      >
        <RiCloseLine size={18} />
      </button>
    </div>
  )
}
