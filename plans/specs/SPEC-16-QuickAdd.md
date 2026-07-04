# SPEC-16: Quick Add Expense from Dashboard
## Quentadoz — Feature Specification

---

## Overview

Quick Add is a floating action button (FAB) on the dashboard that lets users add a single expense item to the current month's budget without navigating to the full budget form. It opens a compact modal with only the essential fields. On submit, the item is saved directly to the current month's budget and the dashboard refreshes.

Quick Add is only available when a real (non-ghost) budget exists for the current month. It is not shown in the ghost preview state or the empty state.

---

## Current System Context

- Dashboard page: `src/app/(app)/dashboard/page.tsx`
- Expense items displayed in: `src/components/widgets/ExpensesTableWidget.tsx`
- Items are stored in `budget_items` table linked to `cutoffs` and `budget_months`
- The full budget form (`BudgetForm.tsx`) is the only current way to add items

---

## Trigger — Floating Action Button (FAB)

A **"+ Add Expense"** FAB is fixed to the bottom-right corner of the dashboard page.

### Desktop
- Position: `fixed bottom-8 right-8`
- Style: pill-shaped button with `--color-accent` background, white text, shadow
- Label: `+ Add Expense`
- Icon: `+` or a plus icon from React Icons

### Mobile
- Position: `fixed bottom-24 right-5` (above the bottom navigation bar)
- Style: circular FAB (icon only, no label)
- Icon: plus icon, 24×24

### Visibility
- Shown only when current month has an active (non-ghost) budget
- Hidden in empty state and ghost preview state
- Hidden when the Quick Add modal is open (replaced by the modal itself)

---

## Quick Add Modal

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Item name | Text input | Yes | Auto-focused on modal open |
| Amount | Numeric input | Yes | PHP currency |
| Cutoff | Dropdown | Yes | Shows available cutoffs: "1st Cutoff", "2nd Cutoff", etc. Defaults to 1st cutoff |
| Due date | Date picker | No | Defaults to end of current month |
| Category | Dropdown | No | Same category list from SPEC-14. Defaults to blank |
| Status | Toggle | No | Paid / Unpaid. Defaults to Unpaid |

### Layout
```
┌─────────────────────────────────────┐
│  Add Expense                    [✕] │
├─────────────────────────────────────┤
│  Item name                          │
│  [                               ]  │
│                                     │
│  Amount              Cutoff         │
│  [PHP         ]      [1st Cutoff ▾] │
│                                     │
│  Due date            Category       │
│  [May 31, 2025]      [— Select —  ▾]│
│                                     │
│  Status: [ Unpaid ]  [ Paid ]       │
├─────────────────────────────────────┤
│              [Cancel]  [Add Expense]│
└─────────────────────────────────────┘
```

### Validation (Zod)
```ts
const quickAddSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  cutoff_id: z.string().uuid('Please select a cutoff'),
  due_date: z.string().nullable().optional(),
  category: z.enum([...BUDGET_CATEGORIES]).nullable().optional(),
  status: z.enum(['paid', 'unpaid']).default('unpaid'),
})
```

---

## Submit Behavior

1. User fills in fields and clicks "Add Expense"
2. Button shows loading spinner, form fields disabled
3. Insert into `budget_items`:
   ```ts
   await supabase.from('budget_items').insert({
     user_id,
     budget_month_id: currentMonth.id,
     cutoff_id: selectedCutoffId,
     name,
     amount,
     due_date: dueDate ?? null,
     status,
     category: category ?? null,
     custom_fields: {}
   })
   ```
4. On success:
   - Close modal
   - Show success toast: *"[Item name] added to [Cutoff label]"*
   - Refresh the dashboard expense table and summary widgets (refetch current month data)
   - FAB reappears
5. On error:
   - Show error toast: *"Failed to add item. Please try again."*
   - Keep modal open with fields intact

---

## Post-Add: Dashboard Refresh

After a successful Quick Add, the following widgets must update without a full page reload:

- `ExpensesTableWidget` — new item appears in the correct cutoff tab
- `TotalSummaryWidget` — total expenses and savings recalculate
- `MonthlySummaryWidget` — per-cutoff breakdown updates
- `HealthScoreWidget` (SPEC-13) — score recalculates
- `DueSoonBanner` — if the new item has a near due date, banner appears

Use the existing `useBudgetStore` to trigger a refetch or update the local state optimistically.

---

## Keyboard and Accessibility

- Modal opens with focus on the Item name field
- Tab order: Name → Amount → Cutoff → Due date → Category → Status → Cancel → Add Expense
- Escape key closes the modal
- Modal traps focus while open (no tabbing to background content)
- FAB is keyboard reachable and shows a visible focus ring

---

## Mobile Behavior

- Modal appears as a **bottom sheet** on mobile (slides up from bottom)
- Bottom sheet has a drag handle at the top
- Fields are full-width stacked vertically
- Keyboard pushes the bottom sheet up (avoid fields hidden behind keyboard)
- "Add Expense" button is full-width at the bottom of the sheet

---

## Components to Create or Modify

| File | Change |
|---|---|
| `src/app/(app)/dashboard/page.tsx` | Add FAB and Quick Add modal, pass cutoffs to modal |
| `src/components/widgets/QuickAddModal.tsx` | New — modal/bottom sheet component |
| `src/components/widgets/QuickAddFAB.tsx` | New — floating action button |
| `src/store/useBudgetStore.ts` | Add refetch trigger or optimistic item append |
| `src/utils/budget.ts` | Reuse `BUDGET_CATEGORIES` from SPEC-14 |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Current month has only 1 cutoff | Cutoff dropdown is hidden, item goes to the single cutoff automatically |
| User adds item with no due date | `due_date` stored as null, row shows "No due date" in table |
| User opens Quick Add and navigates away | Modal closes, no data saved |
| Network is offline | Error toast shown, modal stays open |
| Budget has ghost preview (not confirmed) | FAB is hidden, Quick Add not available |
| Due date entered is in the past | Allowed — no validation error — item appears in danger color in table |

---

## UI Requirements

- FAB must never cover the bottom navigation bar on mobile
- Modal/bottom sheet backdrop is semi-transparent (`bg-black/40`)
- Clicking the backdrop closes the modal (same as Cancel)
- Modal entrance animation: fade + scale from center on desktop, slide up on mobile
- All monetary inputs use the same formatting as the rest of the app (no currency symbol in the input, shown as a prefix label)
- The modal is lightweight — no rich text, no file uploads, no AI features (those belong in the full form)
