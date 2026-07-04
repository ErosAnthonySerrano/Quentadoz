# SPEC-12: Cutoff Count Cap at 6
## Quentadoz — Feature Specification

---

## Overview

The maximum number of salary cutoffs a user can configure per budget month is capped at **6**. This replaces the previous upper limit of 31. The cap is enforced at the UI level, the form validation level, and the database level. A short explanation of what a cutoff is will be shown to new users on Step 1 of the budget form.

---

## Current Behavior (as of snapshot)

- `BudgetForm.tsx` Step 1 allows the user to select cutoff count
- `user_defaults` table stores `cutoff_count` with no enforced upper limit
- The form currently allows selection up to 31 cutoffs per the snapshot description

---

## Why 6

Real-world salary structures that benefit from cutoff-based budgeting:

| Structure | Cutoffs needed |
|---|---|
| Monthly (once a month) | 1 |
| Semi-monthly (1st and 15th) | 2 |
| Weekly | 4 |
| Bi-weekly with side income | 3 |
| Multiple freelance income streams | 3–5 |
| Complex multi-source income | up to 6 |

Nobody genuinely budgets across more than 6 income events per month in a structured cutoff model. Allowing more than 6 creates an unusable UI and blurs into daily expense tracking, which is a different tool.

---

## Changes Required

### 1. BudgetForm Step 1 — Cutoff Selector

Replace the current open-ended selector with fixed buttons for 1 through 6:

```
How many salary cutoffs do you have this month?

  [1]  [2]  [3]  [4]  [5]  [6]
```

- Render as a row of toggle buttons
- Active selection highlighted with accent border and background
- Remove the "Add more" / free number input option entirely
- Default selection: `2` (most common use case in PH)

Add a short helper text below the selector:
> *"A cutoff is a period between salary credits. If you get paid twice a month, select 2."*

This helper text is shown only on first visit or for new users. Dismiss on interaction.

### 2. Zod Schema — `budgetFormSchema.ts`

Update the cutoff count validation:

```ts
// Before
cutoff_count: z.number().min(1).max(31)

// After
cutoff_count: z.number().min(1).max(6)
```

### 3. User Defaults — Profile Page

The default cutoff count selector in `/profile` must also be capped at 6:

```ts
// In user defaults Zod schema
cutoff_count: z.number().min(1).max(6)
```

Render as the same 6-button toggle used in the budget form for consistency.

### 4. Database Constraint

Add a check constraint to both `budget_months` and `user_defaults`:

```sql
alter table budget_months
  add constraint cutoff_count_max_6
  check (cutoff_count >= 1 and cutoff_count <= 6);

alter table user_defaults
  add constraint cutoff_count_max_6
  check (cutoff_count >= 1 and cutoff_count <= 6);
```

### 5. Edit Mode Guard

In `/budget/[id]/edit`, if an existing budget record somehow has `cutoff_count > 6` (legacy data), clamp the displayed value to 6 and show an inline notice:
> *"Your cutoff count has been updated to the maximum of 6."*

Do not block editing — just clamp silently with the notice.

---

## Migration Note

If any existing `budget_months` or `user_defaults` records have `cutoff_count > 6`, run a one-time migration before adding the constraint:

```sql
update budget_months set cutoff_count = 6 where cutoff_count > 6;
update user_defaults set cutoff_count = 6 where cutoff_count > 6;
```

Run this before applying the `add constraint` statements above.

---

## Components to Modify

| File | Change |
|---|---|
| `src/components/forms/BudgetForm.tsx` | Replace open selector with 1–6 button toggle |
| `src/components/forms/budgetFormSchema.ts` | Update max to 6 |
| `src/app/(app)/profile/page.tsx` | Update defaults selector to 1–6 toggle |
| Supabase SQL editor | Run migration + add constraints |

---

## UI Requirements

- The 6-button selector must fit comfortably on mobile in a single row
- On very small screens (< 360px), buttons can wrap to two rows of 3
- Button size: minimum 44×44px tap target on mobile
- Active state: `--color-accent` border + `--color-accent-light` background
- Inactive state: `--color-line` border + `--color-card` background
