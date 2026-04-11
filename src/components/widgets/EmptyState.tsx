'use client'

import React from 'react'
import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
      <div className="text-5xl">📊</div>
      <h2 className="text-xl font-semibold text-header">Welcome to Quentadoz!</h2>
      <p className="text-sm text-muted max-w-xs">
        Start by adding your budget for this month.
      </p>
      <Link
        href="/budget/new"
        className="inline-flex items-center px-6 py-2.5 rounded-md bg-accent text-white text-sm font-medium no-underline mt-2 hover:bg-accent-hover transition-colors"
      >
        Add Budget
      </Link>
    </div>
  )
}

