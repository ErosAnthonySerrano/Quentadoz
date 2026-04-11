export interface User {
  id: string
  email: string
  created_at: string
  app_metadata: {
    provider?: string
  }
}

export interface BudgetMonth {
  id: string
  user_id: string
  month: number
  year: number
  cutoff_count: number
  created_at: string
}

export interface Cutoff {
  id: string
  budget_month_id: string
  cutoff_number: number
  salary: number
  date: string
}

export interface BudgetItem {
  id: string
  user_id: string
  budget_month_id: string
  cutoff_id: string
  name: string
  amount: number
  due_date: string | null
  status: 'paid' | 'unpaid'
  custom_fields: Record<string, string>
  created_at: string
}

export interface ParsedReceiptItem {
  name: string
  amount: number
  due_date: string | null
}

export interface UserDefaultCutoff {
  cutoff_number: number
  salary: number
  day: number | null  // day of month (1–31) for auto-filling credit date
}

export interface UserDefault {
  id: string
  user_id: string
  cutoff_count: number
  cutoffs: UserDefaultCutoff[]
  created_at: string
  updated_at: string
}
