'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BudgetForm } from '@/components/forms/BudgetForm'

function NewBudgetContent() {
  const searchParams = useSearchParams()
  const reuseId = searchParams.get('reuse') ?? undefined

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <h1 className="text-3xl font-semibold text-header mb-8">Create New Budget</h1>
      <BudgetForm mode="new" reuseId={reuseId} />
    </div>
  )
}

export default function NewBudgetPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto pb-8"><div className="h-9 w-48 bg-surface rounded-md animate-pulse mb-8" /><div className="bg-card rounded-lg shadow-card p-5 h-40 animate-pulse" /></div>}>
      <NewBudgetContent />
    </Suspense>
  )
}
