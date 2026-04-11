'use client'

import { create } from 'zustand'
import type { BudgetMonth, Cutoff, BudgetItem } from '@/types'

interface BudgetStore {
  budgetMonth: BudgetMonth | null
  cutoffs: Cutoff[]
  items: BudgetItem[]
  setBudgetData: (budgetMonth: BudgetMonth, cutoffs: Cutoff[], items: BudgetItem[]) => void
  updateItemStatus: (id: string, status: 'paid' | 'unpaid') => void
  clearBudget: () => void
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  budgetMonth: null,
  cutoffs: [],
  items: [],
  setBudgetData: (budgetMonth, cutoffs, items) => set({ budgetMonth, cutoffs, items }),
  updateItemStatus: (id, status) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, status } : item)),
    })),
  clearBudget: () => set({ budgetMonth: null, cutoffs: [], items: [] }),
}))
