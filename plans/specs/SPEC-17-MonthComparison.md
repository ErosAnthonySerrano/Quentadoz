# SPEC-17: Month-over-Month Comparison
## Quentadoz — Feature Specification

---

## Overview

Month-over-Month Comparison is a view inside the History page that lets users select any two months and see a side-by-side breakdown of their budgets. It shows differences in salary, total expenses, savings, per-category spending, and health score between the two selected months. The goal is to give users genuine financial insight — not just a record, but a trend.

---

## Current System Context

- History page: `src/app/(app)/history/page.tsx`
- History loads all `budget_months` with related `cutoffs` and `budget_items`
- Current filters: year, start month, end month
- No comparison view currently exists

---

## Entry Point

A **"Compare Months"** toggle button is added to the history page header, alongside the existing filter controls:

```
[Year ▾]  [From ▾]  [To ▾]  [Category ▾]  |  [⇄ Compare Months]
```

- Clicking "Compare Months" switches the history page into comparison mode
- Clicking again returns to normal history view
- Filters are hidden in comparison mode (replaced by two month pickers)

---

## Comparison Mode UI

### Month selectors
```
Compare:  [April 2025 ▾]   vs   [March 2025 ▾]
```

- Two independent month/year dropdowns
- Populated from the user's existing `budget_months` records only (no empty options)
- Default: most recent month vs second most recent month
- If only one month exists: show a message *"You need at least two months of budget history to compare."*

### Layout
Side-by-side on desktop, stacked (Month A on top, Month B below) on mobile.

---

## Comparison Sections

### Section 1: Summary Cards

```
┌─────────────────────┬─────────────────────┐
│   April 2025        │   March 2025         │
│                     │                      │
│  Salary   ₱30,000   │  Salary   ₱28,000    │
│  Spent    ₱23,800   │  Spent    ₱25,100    │
│  Saved    ₱6,200    │  Saved    ₱2,900     │
│  Score    78 Good   │  Score    61 Fair    │
└─────────────────────┴─────────────────────┘
```

- Each column is a card using `--color-card` background
- Differences shown between the two months as small delta badges:
  - Saved ₱6,200 → +₱3,300 vs March (green up arrow)
  - Spent ₱23,800 → -₱1,300 vs March (green down arrow, spending went down = good)
- Delta badge color: green if improvement, red if regression, neutral if same

### Section 2: Category Comparison Bar Chart

A grouped horizontal bar chart showing spending per category for both months side by side.

```
Food & Dining    ████████ ₱4,200  (Apr)
                 ██████   ₱3,100  (Mar)

Transportation   ████     ₱2,100  (Apr)
                 ████     ₱2,000  (Mar)

Utilities        ███      ₱1,500  (Apr)
                 ████     ₱2,200  (Mar)
```

- Built with Recharts `BarChart` in horizontal layout
- Two bars per category — Month A (accent color) and Month B (muted accent / secondary color)
- Only categories with spend in at least one of the two months are shown
- Uncategorized items grouped as "Other"
- Chart is scrollable vertically on mobile if many categories

### Section 3: Expense List Comparison

A two-column table listing all budget items from both months:

```
Item              April 2025        March 2025
────────────────────────────────────────────────
Netflix           ₱649  ✓ Paid      ₱649  ✓ Paid
Meralco           ₱2,100 ✓ Paid    ₱1,800 ✓ Paid
Motorcycle Loan   ₱7,000 ✓ Paid    ₱7,000 ✓ Paid
New item (Apr)    ₱500  ✗ Unpaid   —
```

- Items are matched by name (case-insensitive)
- Items that exist in one month but not the other show "—" in the other column
- Amount differences highlighted: green if cheaper, red if more expensive
- Status shown as a small paid/unpaid badge

### Section 4: Health Score Comparison

```
Budget Health
April 2025    ████████████████░░░░  78  Good
March 2025    ████████████░░░░░░░░  61  Fair

↑ Improved by 17 points
```

- Two stacked progress bars
- Improvement/regression note below

---

## Data Requirements

All data needed for comparison is already fetched by the history page on load (all `budget_months`, `cutoffs`, `budget_items`). No additional API calls are needed — comparison is computed client-side by filtering from the already-loaded data.

### Computation helpers (add to `src/utils/budget.ts`)

```ts
export function getMonthRecord(
  records: BudgetMonthRecord[],
  month: number,
  year: number
): BudgetMonthRecord | undefined

export function compareMonths(
  monthA: BudgetMonthRecord,
  monthB: BudgetMonthRecord
): MonthComparison

interface MonthComparison {
  salaryDelta: number
  spentDelta: number
  savedDelta: number
  scoreDelta: number
  categoryDeltas: Record<BudgetCategory, { a: number; b: number; delta: number }>
  itemComparisons: ItemComparison[]
}

interface ItemComparison {
  name: string
  amountA: number | null
  amountB: number | null
  statusA: 'paid' | 'unpaid' | null
  statusB: 'paid' | 'unpaid' | null
  delta: number | null
}
```

---

## Components to Create or Modify

| File | Change |
|---|---|
| `src/app/(app)/history/page.tsx` | Add Compare toggle, month pickers, conditional render of comparison view |
| `src/components/history/ComparisonView.tsx` | New — full comparison layout |
| `src/components/history/ComparisonSummaryCards.tsx` | New — summary card pair with deltas |
| `src/components/history/ComparisonCategoryChart.tsx` | New — grouped bar chart |
| `src/components/history/ComparisonItemTable.tsx` | New — side-by-side item list |
| `src/components/history/ComparisonHealthScore.tsx` | New — dual progress bar score view |
| `src/utils/budget.ts` | Add `compareMonths()`, `getMonthRecord()` |
| `src/types/index.ts` | Add `MonthComparison`, `ItemComparison` interfaces |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| User selects the same month for both | Show inline warning: *"Please select two different months."* Disable the comparison render |
| One of the selected months has no items | Show comparison with zeros for the empty month |
| A category exists in Month A but not Month B | Show the category with Month B value as ₱0 |
| Items have no categories assigned | Grouped under "Other" in chart |
| User has only one budget month | Comparison mode shows: *"You need at least 2 months of data to compare."* |
| Very many items (20+) in item comparison | Table is paginated or scrollable with a max-height |

---

## UI Requirements

- Comparison mode is clearly indicated — page header changes to show "Comparing [Month A] vs [Month B]"
- Exit comparison mode button is always visible
- Delta badges use consistent arrow icons: `↑` improvement, `↓` regression, `→` no change
- "Improvement" is context-sensitive: lower spending = green, higher savings = green, higher score = green
- Bar chart legend clearly labels which color is Month A and which is Month B
- All monetary values use the existing currency formatter
- Comparison view is fully responsive — stacks gracefully on mobile
- Recharts chart is wrapped in a `ResponsiveContainer` for fluid width
