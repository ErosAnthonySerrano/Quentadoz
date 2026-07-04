# SPEC-10: Auto Carry-Over Previous Budget
## Quentadoz — Feature Specification

---

## Overview

When a user opens the dashboard for the current month and no budget exists yet, instead of showing a cold empty state with only a "Create Budget" CTA, Quentadoz automatically finds the most recent previous budget and displays it as a **ghost preview** — a read-only view of last month's data presented as a helpful starting point, not a finalized record.

The user is given three explicit choices:
1. **Use it as-is** — one click to confirm and create this month's budget from the previous one
2. **Edit first** — opens the budget form pre-filled with previous month data for review before saving
3. **Ignore it** — dismiss and create a fresh budget from scratch

Until the user makes a choice, the ghost preview remains visible as the dashboard state for the current month.

---

## Current Behavior (as of snapshot)

- `dashboard/page.tsx` fetches the current month's `budget_month` record
- If no record exists, `EmptyState.tsx` is rendered — a simple prompt to create a new budget
- There is no automatic fallback to previous month data

---

## New Behavior

### Priority order for fallback
1. Check for a `budget_month` record matching the current `month` and `year` for the user
2. If found → render dashboard normally (no change)
3. If not found → query for the most recent previous `budget_month` for the user ordered by `year DESC`, `month DESC`
4. If a previous record exists → render ghost preview state
5. If no previous record exists at all → render the existing `EmptyState` (new user, no history)

---

## Ghost Preview State

### Visual treatment
- The dashboard renders all four widgets (Cutoff Salary Overview, Total Summary, Expenses Table, Monthly Summary) using the previous month's data
- A **prominent banner** sits above all widgets — not dismissible, always visible while in ghost state
- All widgets are rendered with a **subtle visual indicator** that this is not live data:
  - Reduced opacity on widget content: `opacity-70`
  - A soft overlay or desaturated tint on widget backgrounds
  - A small "Preview" badge on each widget header

### Ghost banner content
```
📋  Showing your [Month Year] budget as a preview.
    No budget has been created for [Current Month Year] yet.

[Edit Before Using]   [Use This Month]   [Start Fresh]
```

- Banner background: `--color-surface`
- Banner border: `--color-line`
- Left-aligned text, right-aligned or inline action buttons
- Fully responsive — buttons stack vertically on mobile

### Button behaviors

#### "Use This Month"
- One-click confirm — no form, no steps
- Creates a new `budget_month` for the current month/year
- Duplicates all `cutoffs` from the previous record (same `salary`, `cutoff_number`, `date` remapped to current month)
- Duplicates all `budget_items` (same `name`, `amount`, `due_date` remapped, `status` reset to `'unpaid'`, `custom_fields` preserved)
- Active installments for the current month are injected automatically (see SPEC-11)
- On success: dismisses the ghost banner, refreshes dashboard with live data
- Shows a success toast: *"Budget created from [Month Year]. You're all set!"*
- Shows a loading spinner on the button while saving

#### "Edit Before Using"
- Navigates to `/budget/new?reuse=[previousBudgetMonthId]`
- The existing `reuseId` query param flow in `BudgetForm.tsx` already handles pre-filling — no new logic needed there
- User reviews and adjusts, then saves normally
- On save, redirects to `/dashboard` with live data

#### "Start Fresh"
- Navigates to `/budget/new` with no query params
- Dismisses the ghost preview for the session (does not permanently hide it — if user navigates back without saving, ghost preview returns)

---

## Date Remapping Logic

When duplicating cutoff dates and item due dates from a previous month to the current month:

- Extract the **day of month** from each original date
- Apply that same day to the current month and year
- If the day does not exist in the current month (e.g. previous month had Feb 30 → clamp to last day of current month)
- Use a shared utility function: `remapDateToMonth(originalDate: string, targetMonth: number, targetYear: number): string`
- This utility already exists partially in `src/utils/budget.ts` — extend it for this use case

---

## Data Operations for "Use This Month"

```ts
// 1. Insert budget_month
const { data: newMonth } = await supabase
  .from('budget_months')
  .insert({ user_id, month: currentMonth, year: currentYear, cutoff_count: previousMonth.cutoff_count })
  .select()
  .single()

// 2. For each cutoff in previous month
for (const cutoff of previousCutoffs) {
  const { data: newCutoff } = await supabase
    .from('cutoffs')
    .insert({
      budget_month_id: newMonth.id,
      cutoff_number: cutoff.cutoff_number,
      salary: cutoff.salary,
      date: remapDateToMonth(cutoff.date, currentMonth, currentYear)
    })
    .select()
    .single()

  // 3. For each item in that cutoff
  const items = previousItems.filter(i => i.cutoff_id === cutoff.id)
  await supabase.from('budget_items').insert(
    items.map(item => ({
      user_id,
      budget_month_id: newMonth.id,
      cutoff_id: newCutoff.id,
      name: item.name,
      amount: item.amount,
      due_date: remapDateToMonth(item.due_date, currentMonth, currentYear),
      status: 'unpaid',
      custom_fields: item.custom_fields ?? {}
    }))
  )
}
```

---

## State Management

- Add a `ghostPreview` state to `useBudgetStore`:
  ```ts
  ghostPreview: BudgetMonthRecord | null
  setGhostPreview: (record: BudgetMonthRecord | null) => void
  ```
- Dashboard page sets `ghostPreview` when no current month record is found but a previous one exists
- Ghost preview is session-only — not persisted to localStorage

---

## Components to Create or Modify

| File | Change |
|---|---|
| `src/app/(app)/dashboard/page.tsx` | Add fallback query for previous month; pass ghost state to widgets |
| `src/components/widgets/EmptyState.tsx` | Keep for true new users (no history at all) |
| `src/components/widgets/GhostPreviewBanner.tsx` | New component — the banner with three action buttons |
| `src/utils/budget.ts` | Add/extend `remapDateToMonth()` utility |
| `src/store/useBudgetStore.ts` | Add `ghostPreview` state |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Previous month had 3 cutoffs, user wants to use it | All 3 cutoffs and their items are duplicated |
| Due date day doesn't exist in current month | Clamped to last day of current month |
| User clicks "Use This Month" and network fails | Show error toast, keep ghost preview visible |
| User has a budget_month record for current month already | Ghost preview never shown, normal dashboard renders |
| User is a brand new user with no history | `EmptyState` shown as before, no ghost preview |
| Previous month had installments | Active installments are injected fresh — not duplicated from items |

---

## UI Requirements

- Ghost preview must be clearly distinguishable from a real live budget at a glance
- The banner must be the first thing the user sees — above widgets, below the due-soon banner if one exists
- Buttons in the banner must have clear visual hierarchy: "Use This Month" is the primary action (accent fill), "Edit Before Using" is secondary (outline), "Start Fresh" is tertiary (ghost/text)
- Loading state on "Use This Month" button while the duplication request is in flight
- All widgets in ghost state remain non-interactive — status toggle buttons are disabled
- On mobile, the banner stacks vertically with full-width buttons
