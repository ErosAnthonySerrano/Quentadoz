# SPEC-14: Spending Categories
## Quentadoz — Feature Specification

---

## Overview

Spending Categories add an optional classification layer to budget items. Each item can be assigned a category from a fixed predefined list. Categories enable breakdown charts on the dashboard, filters in history, and AI-assisted auto-categorization. A single "Auto-Categorize" button in the budget form sends all uncategorized items to Gemini, which assigns the most appropriate category from the fixed list.

---

## Category List (Fixed, System-Defined)

The following categories are available globally across all users. Users cannot create custom categories — this ensures consistency in charts, filters, and AI outputs.

| Category | Icon suggestion |
|---|---|
| Food & Dining | 🍽 |
| Transportation | 🚗 |
| Utilities | 💡 |
| Subscriptions | 📱 |
| Loan / Installment | 💳 |
| Healthcare | 🏥 |
| Education | 📚 |
| Shopping | 🛍 |
| Entertainment | 🎮 |
| Savings | 🏦 |
| Housing | 🏠 |
| Personal Care | 💆 |
| Other | 📦 |

These are stored as string constants in `src/utils/budget.ts` — not in the database. No `categories` table is needed.

```ts
export const BUDGET_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Utilities',
  'Subscriptions',
  'Loan / Installment',
  'Healthcare',
  'Education',
  'Shopping',
  'Entertainment',
  'Savings',
  'Housing',
  'Personal Care',
  'Other',
] as const

export type BudgetCategory = typeof BUDGET_CATEGORIES[number]
```

---

## Database Change

Add a `category` column to `budget_items`:

```sql
alter table budget_items
  add column category text default null;
```

- Nullable — existing items and new items without a category are valid
- No foreign key or check constraint — validation is handled in application code via Zod
- `custom_fields` jsonb is not used for category — it gets its own dedicated column for queryability

Update the Zod schema in `budgetFormSchema.ts`:

```ts
category: z.enum([...BUDGET_CATEGORIES]).nullable().optional()
```

---

## Budget Form — Category Field

### Per-item category dropdown
Each item row in `CutoffSection.tsx` gets a new **Category** column with a dropdown selector:

- Dropdown options: all 13 categories + a blank "— Select category —" option
- Category is optional — leaving it blank is valid
- On mobile (card layout), category appears as a full-width select below the item name
- Installment items auto-set to `'Loan / Installment'` and the field is read-only for them

### Auto-Categorize Button
A single **"Auto-Categorize"** button appears in the cutoff section header, next to the existing "Scan with AI" button.

```
[Cutoff 1 Header]          [🤖 Auto-Categorize]  [📷 Scan with AI]
```

#### Behavior
1. User clicks "Auto-Categorize" on a cutoff section
2. Button shows a loading spinner
3. Client calls `POST /api/categorize-items` with the list of item names from that cutoff
4. API route sends item names to Gemini with a strict prompt
5. Gemini returns a JSON map of `{ itemName: category }` using only the allowed categories
6. Client updates the category dropdown for each matched item
7. User can review and override any category before saving
8. Items already manually categorized are skipped (not overwritten unless user clears them first)

#### Gemini prompt for categorization
```
You are a budget categorization assistant. 
Categorize each of the following expense items into exactly one of these categories:
[Food & Dining, Transportation, Utilities, Subscriptions, Loan / Installment, 
Healthcare, Education, Shopping, Entertainment, Savings, Housing, Personal Care, Other]

Rules:
- Use ONLY the categories listed above. Do not invent new categories.
- If unsure, use "Other".
- Return ONLY a JSON object with no extra text, no markdown:
  { "item name": "category", "item name": "category" }

Items to categorize:
[list of item names]
```

#### API Route: `POST /api/categorize-items`

- Method: `POST`
- Body: `{ items: string[] }` — array of item names
- Requires valid session
- Uses `GEMINI_API_KEY` server-side only
- Strip markdown fences before `JSON.parse()`
- Validate each returned category against `BUDGET_CATEGORIES` — reject/default to `'Other'` any value not in the list
- Response: `{ categories: Record<string, BudgetCategory> }`

---

## Dashboard — Category Breakdown Widget

A new widget added to the dashboard showing a **donut chart** of spending by category for the current month.

### Widget placement
Below the Installments widget (SPEC-11). Full width on mobile, half-width on desktop (paired with Monthly Summary).

### Chart
- Donut chart using **Recharts** `PieChart` with `innerRadius`
- One segment per category that has at least one item
- Each segment colored using the existing chip color system extended to all categories:

```ts
export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  'Food & Dining': '#ff9c27',
  'Transportation': '#0f7aff',
  'Utilities': '#19c7c5',
  'Subscriptions': '#7f3dff',
  'Loan / Installment': '#db2e2e',
  'Healthcare': '#e91e8c',
  'Education': '#2196f3',
  'Shopping': '#ff5722',
  'Entertainment': '#9c27b0',
  'Savings': '#4caf50',
  'Housing': '#795548',
  'Personal Care': '#f06292',
  'Other': '#78909c',
}
```

- Center of donut shows total categorized spend
- Legend below the chart shows each category with its amount and percentage
- Uncategorized items are grouped under "Other" in the chart
- Clicking a segment filters the Expenses Table to show only items of that category (temporary filter, cleared on refresh)

### Empty state
If no items have categories: *"Categorize your budget items to see a spending breakdown."* with a button linking to the budget form.

---

## History Page — Category Filter

Add a **Category** filter dropdown to the existing history filters:

```
Year: [2025]   Months: [Jan → Dec]   Category: [All Categories ▾]
```

- When a category is selected, only budget items of that category are shown in the tables
- Cutoff and monthly totals recalculate to reflect the filtered view
- A small banner indicates the filter is active: *"Showing Food & Dining items only. [Clear filter]"*

---

## Components to Create or Modify

| File | Change |
|---|---|
| `src/components/forms/CutoffSection.tsx` | Add category dropdown per row + Auto-Categorize button |
| `src/app/api/categorize-items/route.ts` | New — Gemini categorization API route |
| `src/components/widgets/CategoryBreakdownWidget.tsx` | New — donut chart dashboard widget |
| `src/app/(app)/dashboard/page.tsx` | Add category breakdown widget |
| `src/app/(app)/history/page.tsx` | Add category filter |
| `src/utils/budget.ts` | Add `BUDGET_CATEGORIES`, `CATEGORY_COLORS`, `BudgetCategory` type |
| `src/components/forms/budgetFormSchema.ts` | Add category field to item schema |
| `src/types/index.ts` | Add `category` to `BudgetItem` interface |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Gemini returns a category not in the allowed list | Silently default to `'Other'` |
| Gemini fails or times out | Show error toast: *"Auto-categorization failed. Please assign categories manually."* |
| User has no items in a cutoff | Auto-Categorize button is disabled |
| Item name is very generic (e.g. "misc") | Gemini assigns `'Other'` — acceptable |
| All items already categorized | Auto-Categorize skips them all, shows toast: *"All items already categorized."* |
| Category breakdown widget with 1 item | Still renders donut with a single segment |

---

## UI Requirements

- Category dropdown is compact — does not bloat the item row width
- On mobile card layout, category is a full-width select below the item fields
- Auto-Categorize button shows a spinner per cutoff section independently
- Donut chart is responsive — scales down on mobile
- Category colors are consistent across the chart, legend, history badges, and any future uses
- Category badges in history table are small colored pills matching `CATEGORY_COLORS`
