export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

export function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  return Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export type DueStatus = 'safe' | 'medium' | 'warning' | 'danger' | 'none'

export function getDueStatus(dueDate: string | null): DueStatus {
  const days = getDaysUntilDue(dueDate)
  if (days === null) return 'none'
  if (days > 15) return 'safe'
  if (days >= 9) return 'medium'
  if (days >= 5) return 'warning'
  return 'danger'
}

export const dueStatusClasses: Record<DueStatus, { row: string; text: string }> = {
  safe:    { row: '',    text: 'text-due-safe' },
  medium:  { row: '',  text: 'text-due-medium' },
  warning: { row: '', text: 'text-due-warning' },
  danger:  { row: '',  text: 'text-due-danger' },
  none:    { row: '',  text: 'text-body' },
}

export function ordinalLabel(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]) + ' Cutoff'
}
