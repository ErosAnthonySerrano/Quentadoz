import { z } from 'zod'

export const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().min(0.01, 'Must be a positive number'),
  due_date: z.string().min(1, 'Due date is required'),
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
