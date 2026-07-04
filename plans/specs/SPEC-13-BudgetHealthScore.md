# SPEC-13: Budget Health Score
## Quentadoz — Feature Specification

---

## Overview

The Budget Health Score is a single computed score (0–100) that gives the user a quick at-a-glance read on how well they managed their budget for the current month. It is displayed on the dashboard as a visual score indicator. Over time, users can track their score month-over-month in the history page.

The score is friendly and encouraging — not punishing. It is designed to motivate good financial habits, not shame the user.

---

## Score Computation

The score is computed from three weighted components:

### Component 1: Bill Payment Rate (40 points max)
Measures what percentage of budget items have been marked as paid.

```ts
const paymentRate = paidItems / totalItems  // 0.0 to 1.0
const paymentScore = paymentRate * 40
```

- All items paid → 40 points
- Half paid → 20 points
- Nothing paid → 0 points

> Note: Only items with a `due_date` on or before today are counted. Future bills not yet due are excluded from this calculation to avoid penalizing the user unfairly.

### Component 2: Savings Rate (40 points max)
Measures how much of the total salary was saved (not spent).

```ts
const savingsRate = totalSavings / totalSalary  // can be negative
const clampedRate = Math.max(0, Math.min(savingsRate, 1))
const savingsScore = clampedRate * 40
```

| Savings rate | Points |
|---|---|
| 20%+ saved | 40 (full) |
| 10–19% saved | ~20–36 |
| Broke even (0%) | 0 |
| Over budget (negative) | 0 |

### Component 3: Budget Adherence (20 points max)
Measures how close actual spending was to the planned budget (total items amount vs total salary).

```ts
const plannedExpenseRate = totalItemsAmount / totalSalary
const adherenceScore = plannedExpenseRate <= 1.0
  ? 20  // stayed within budget
  : Math.max(0, 20 - ((plannedExpenseRate - 1) * 100))  // penalize overspend
```

- Stayed within budget → 20 points
- 10% over budget → ~10 points
- 20%+ over budget → 0 points

### Final score

```ts
const healthScore = Math.round(paymentScore + savingsScore + adherenceScore)
// Result: 0 to 100
```

### Score labels

| Score | Label | Color token |
|---|---|---|
| 85–100 | Excellent | `--color-due-safe` |
| 65–84 | Good | `--color-due-medium` |
| 45–64 | Fair | `--color-due-warning` |
| 0–44 | Needs Attention | `--color-due-danger` |

---

## Dashboard Widget

### Placement
Integrated into the existing **Total Summary Widget** (`TotalSummaryWidget.tsx`) as a new section below the total salary and savings figures. Does not get its own separate widget card — it lives inside the summary to keep the dashboard from getting too crowded.

### Visual design

```
┌─────────────────────────────────────────┐
│  Total Salary        PHP 30,000         │
│  Total Savings       PHP 6,200          │
│                                         │
│  Budget Health                          │
│  ████████████████░░░░  78 / 100         │
│  Good · Based on this month's activity  │
└─────────────────────────────────────────┘
```

- Score label (Excellent / Good / Fair / Needs Attention) in the appropriate status color
- A horizontal progress bar filled to the score percentage
- Progress bar color matches the score label color token
- Small muted subtitle: *"Based on this month's activity"*
- Score animates from 0 to the final value on mount (300ms ease-out)

### Score breakdown tooltip / popover
Tapping or hovering the score area opens a small popover showing the three component scores:

```
Bill Payment     32 / 40
Savings Rate     28 / 40
Adherence        18 / 20
─────────────────────────
Total            78 / 100
```

This helps users understand what's dragging their score down and what to improve.

### Empty / partial state
- If the month has no budget items at all: score is not shown, replaced with *"Add budget items to see your health score."*
- If the month is early and no items are due yet: show score based on available data with a note: *"Score will update as bills come due."*

---

## History Page Integration

Add a **Health Score column** to the monthly summary row in the history table:

```
April 2025  |  PHP 30,000  |  PHP 23,800  |  PHP 6,200  |  78 — Good
```

- Score is stored on the `budget_months` record when the month is finalized (end of month) or can be recomputed on read
- Color-coded badge in the history table matching the score label color

### Storage decision
Do **not** add a `health_score` column to `budget_months`. Recompute the score on read from existing `cutoffs` and `budget_items` data. This avoids stale scores and keeps the schema clean.

---

## Month-over-Month Trend (Mini)
In the dashboard widget, below the score, show a simple trend indicator comparing to last month's score:

```
↑ +12 from last month    (green arrow if improved)
↓ -5 from last month     (red arrow if declined)
→ Same as last month     (neutral if within ±2 points)
```

---

## Utility Function

Add to `src/utils/budget.ts`:

```ts
export function computeHealthScore(params: {
  items: BudgetItem[]
  cutoffs: Cutoff[]
  today: Date
}): {
  total: number
  paymentScore: number
  savingsScore: number
  adherenceScore: number
  label: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention'
  colorToken: string
}
```

---

## Components to Create or Modify

| File | Change |
|---|---|
| `src/components/widgets/TotalSummaryWidget.tsx` | Add health score section |
| `src/components/widgets/HealthScorePopover.tsx` | New — breakdown popover |
| `src/app/(app)/history/page.tsx` | Add score column to monthly summary row |
| `src/utils/budget.ts` | Add `computeHealthScore()` |
| `src/types/index.ts` | Add `HealthScore` interface |

---

## UI Requirements

- Score never displays as a raw decimal — always a rounded integer
- Progress bar animation only plays once per mount, not on re-renders
- Popover is keyboard accessible and closable with Escape
- On mobile, popover becomes a bottom sheet
- Score section is not shown if current month has zero budget items
- All color tokens used for score states must come from the existing token system (no new colors needed)
