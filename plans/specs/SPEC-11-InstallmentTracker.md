# SPEC-11: Installment Tracker
## Quentadoz — Feature Specification

---

## Overview

The Installment Tracker allows users to define recurring monthly payment commitments — such as a motorcycle loan, phone installment, or laptop plan — once, and have them automatically appear as budget line items every month for the duration of the installment. Users can monitor all active installments from a dedicated dashboard widget showing progress, remaining months, and total commitment.

Installments are managed from the **Step 1 screen of the budget flow** and live in a separate `installments` table independent of any specific budget month.

---

## Current System Context

- `src/app/(app)/budget/new/page.tsx` wraps `BudgetForm.tsx`
- Step 1 of `BudgetForm.tsx` currently handles: cutoff count selection, reuse options, and user defaults loading
- `budget_items` table stores per-month expense items per cutoff
- No installment concept currently exists in the data model

---

## New Database Table: `installments`

```sql
create table installments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  monthly_amount numeric(12,2) not null,
  total_months int not null,
  start_month int not null,
  start_year int not null,
  cutoff_number int not null default 1,
  category text not null default 'Loan',
  created_at timestamptz default now()
);

alter table installments enable row level security;
create policy "own installments" on installments
  for all using (auth.uid() = user_id);
```

### Computed fields (derived, not stored)
These are calculated at runtime from the stored fields and the current month/year:

| Field | Formula |
|---|---|
| `months_elapsed` | `((currentYear - start_year) * 12) + (currentMonth - start_month)` |
| `months_paid` | `min(months_elapsed, total_months)` |
| `months_remaining` | `max(total_months - months_paid, 0)` |
| `total_cost` | `monthly_amount × total_months` |
| `total_paid` | `monthly_amount × months_paid` |
| `total_remaining` | `monthly_amount × months_remaining` |
| `end_month` | `start_month + total_months - 1` (with year rollover) |
| `is_active` | `months_remaining > 0` |
| `is_completed` | `months_remaining === 0` |

---

## Step 1 — Installment Management Panel

### Placement
Below the existing cutoff selection and reuse options in Step 1, a new collapsible section is added:

```
─────────────────────────────────────
  Your Installments
  [+ Add Installment]
─────────────────────────────────────
  [Yamaha Motorcycle]  PHP 7,000/mo  4/12 months  →  8 remaining
  [iPhone 15]          PHP 3,500/mo  2/6 months   →  4 remaining
─────────────────────────────────────
```

- If the user has no installments, the section shows a short empty message: *"No active installments. Add one to track recurring payments."*
- Each installment row shows: name, monthly amount, progress (X/Y months), months remaining
- A small colored badge indicates status: active (accent color) or completed (muted)
- Completed installments are shown at the bottom in a collapsed "Completed" group

### Add Installment Modal
Triggered by the **"+ Add Installment"** button. Opens a modal (not a new page).

#### Modal fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Name | Text input | Yes | e.g. "Yamaha Motorcycle" |
| Monthly payment | Numeric input | Yes | Amount paid each month |
| Total months | Numeric input | Yes | e.g. 12, 24, 36 |
| Start month | Month + Year picker | Yes | When the first payment was/is due |
| Cutoff | Dropdown (1st–6th) | Yes | Which cutoff this comes out of |
| Category | Dropdown (see categories) | Yes | Default: "Loan" |

#### Mid-installment entry handling
If `start_month/year` is before the current month, the system shows an inline note:
*"Based on your start date, [N] months have already passed. We'll count from month [N+1] going forward."*

This sets `months_paid` correctly without requiring the user to manually mark past months.

#### Modal footer — computed preview (live updates as user types)
```
Monthly payment:    PHP 7,000
Total cost:         PHP 84,000
Already paid:       PHP 21,000 (3 months)
Remaining:          PHP 63,000 (9 months)
Estimated end:      October 2025
```

#### Edit and delete
- Each installment row in the panel has an edit (pencil) icon and delete (trash) icon
- Edit reopens the modal pre-filled
- Delete shows a confirmation prompt: *"Remove this installment? It will no longer appear in future budgets."*
- Deleting does not remove it from past budget_items already created

---

## Auto-Injection into Budget

When the user proceeds from Step 1 to Step 2 of the budget form, all **active installments** for the current month are automatically injected into their designated cutoff sections as pre-populated line items.

### Injection logic

```ts
function isActiveForMonth(installment: Installment, month: number, year: number): boolean {
  const startTotal = installment.start_year * 12 + installment.start_month
  const targetTotal = year * 12 + month
  const endTotal = startTotal + installment.total_months - 1
  return targetTotal >= startTotal && targetTotal <= endTotal
}
```

### Injected item properties
- `name`: installment name
- `amount`: `monthly_amount`
- `due_date`: same day as the cutoff's credit date for that month (or last day of month if cutoff date not yet set)
- `status`: `'unpaid'`
- `custom_fields`: `{ installment_id: installment.id, is_installment: true }`
- `cutoff_id`: matched to the cutoff with `cutoff_number === installment.cutoff_number`

### Visual treatment in the budget form
- Injected installment items display an **"Installment" badge** next to their name
- The amount field is **read-only** — user cannot change the amount inline (they must edit the installment itself from Step 1)
- The item **cannot be deleted** from the cutoff section — a tooltip explains: *"This item is managed from your Installments. Go back to Step 1 to edit or remove it."*
- Status (paid/unpaid) remains editable as normal

### Edit mode behavior
When editing an existing budget (`/budget/[id]/edit`), installment items are already present in the saved `budget_items`. They are identified by `custom_fields.is_installment === true` and rendered as read-only with the installment badge.

---

## Dashboard Widget: Installments

A new widget on the dashboard displaying all active installments.

### Widget placement
Below the existing four widgets, before the Monthly Summary. On desktop, rendered as a full-width widget. On mobile, full-width stacked.

### Widget layout

#### Header row
```
Commitments                           [N active · PHP XX,XXX/mo total]
```

#### Per-installment card (compact horizontal)
```
[Category Icon]  Yamaha Motorcycle
                 PHP 7,000/mo · 8 months remaining · ends Oct 2025
                 ████████░░░░  4 of 12 months paid
```

- Progress bar uses `--color-accent` for filled portion, `--color-line` for track
- End date shown in muted text
- If installment is completed this month: show a "Completed 🎉" state in green
- Cards are vertically stacked, scrollable if more than 3

#### Empty state
If no active installments: *"No active installments. Add one from the budget form."* with a link to `/budget/new`.

#### Completed installments
Not shown on dashboard by default — only active ones. Completed ones are visible in the Step 1 installments panel with a "Completed" badge.

---

## Installment Categories

Use the same category system defined in SPEC-14. Suggested defaults for installments:
- Loan
- Electronics
- Appliance
- Vehicle
- Furniture
- Education
- Other

---

## Components to Create or Modify

| File | Change |
|---|---|
| `src/app/(app)/budget/new/page.tsx` | Pass installments data to BudgetForm |
| `src/components/forms/BudgetForm.tsx` | Add installment panel to Step 1; inject items in Step 2 |
| `src/components/forms/InstallmentPanel.tsx` | New — installment list in Step 1 |
| `src/components/forms/InstallmentModal.tsx` | New — add/edit installment modal |
| `src/components/widgets/InstallmentsWidget.tsx` | New — dashboard widget |
| `src/app/(app)/dashboard/page.tsx` | Fetch and pass installments to widget |
| `src/types/index.ts` | Add `Installment` interface and computed fields |
| `src/utils/budget.ts` | Add `isActiveForMonth()`, `computeInstallmentProgress()` |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Cutoff number in installment no longer exists in budget | Inject into cutoff 1 with a warning banner in Step 2 |
| User changes cutoff count to fewer than installment's cutoff | Show warning in Step 1: *"[Name] is assigned to cutoff [N] which doesn't exist in this budget."* |
| Installment start date is in the future | Not active yet — not injected, shown as "Upcoming" in panel |
| Two installments assigned to same cutoff | Both injected — no conflict, just two separate line items |
| User creates budget via "Use This Month" carry-over | Installment injection still runs after carry-over items are duplicated |
| Installment completes mid-year | Last month of injection is `start_month + total_months - 1`. Month after that it is not injected. |

---

## UI Requirements

- Installment panel in Step 1 is collapsible to save space when user has many installments
- Modal is mobile-friendly — single column layout on small screens
- Progress bar is animated on initial render (fills from 0 to current progress)
- All monetary values formatted using the existing currency formatter in `src/utils/budget.ts`
- Installment badge in budget form is visually distinct but not distracting — small pill, muted color
- Widget on dashboard gracefully handles 0, 1, and many installments
