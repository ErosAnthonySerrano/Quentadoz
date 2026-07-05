import { z } from 'zod'

export const cutoffCountSchema = z.number().int().min(1).max(6, 'Cutoff count must be between 1 and 6')

export function clampCutoffCount(value: number): number {
  if (!Number.isFinite(value)) return 2
  const rounded = Math.round(value)
  const parsed = cutoffCountSchema.safeParse(rounded)
  return parsed.success ? parsed.data : Math.min(6, Math.max(1, rounded))
}

export const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().min(0.01, 'Must be a positive number'),
  due_date: z.string().optional(),
  custom_fields: z.record(z.string(), z.string()).default({}),
})

export const cutoffSchema = z.object({
  id: z.string().optional(),
  cutoff_number: z.number(),
  salary: z.coerce.number().min(0.01, 'Salary must be positive'),
  date: z.string().min(1, 'Date is required'),
  customColumns: z.array(z.string()).default([]),
  items: z.array(itemSchema).min(1, 'At least one item required'),
})

export const formSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  cutoffs: z.array(cutoffSchema).min(1),
})

export type ItemFormValue = z.infer<typeof itemSchema>
export type CutoffFormValue = z.infer<typeof cutoffSchema>
export type FormValues = z.infer<typeof formSchema>

export function emptyItem(): ItemFormValue {
  return { name: '', amount: 0, due_date: '', custom_fields: {} }
}

export function emptyCutoff(cutoff_number: number, customColumns: string[] = []): CutoffFormValue {
  return {
    cutoff_number,
    salary: 0,
    date: '',
    customColumns,
    items: [emptyItem()],
  }
}
