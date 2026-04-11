# SPEC-05: History Page
## Quentadoz — Feature Specification

---

## Overview

The History page shows all past monthly budgets for the logged-in user. Records are grouped by year, then sorted by month descending (most recent first). Each month has its own table showing per-cutoff data and a final summary row.

**Route:** `/history` — Protected.

---

## Filters

- Year selector: dropdown listing all years the user has budget data for
- Month range: optional from-month and to-month selectors within the chosen year
- "Clear filters" button resets to showing all records
- Filters are applied client-side — all data is fetched on page load

---

## Page Layout

Records are grouped by year. Within each year group:

- A large year heading (e.g. "2025") is shown with generous spacing above it
- Below the year heading, each month is shown as a separate table
- Months are sorted descending (December to January)
- If multiple years are shown, year groups are separated by a visual divider

---

## Monthly Table Structure

### Month Header

- Label: Month name + Year (e.g. "April 2025")
- An "Export to PDF" button aligned to the right of the month header
- An "Edit" link that goes to `/budget/[id]/edit` for that month

### Per-Cutoff Section

For each cutoff within the month, show a sub-table with:

| Column | Description |
|---|---|
| Cutoff Label | e.g. "1st Cutoff — PHP 15,000.00 — April 5, 2025" |
| Item Name | Budget item name |
| Amount | Formatted as currency |
| Due Date | Formatted date |
| Status | Paid or Unpaid badge |

### Cutoff Summary Row

After each cutoff's items, show a summary row:
- Total Expenses = sum of all items in that cutoff
- Remaining Balance = cutoff salary − total expenses

### Month Summary Row

After all cutoffs, show a final summary row spanning the full table:
- Total Salary (all cutoffs combined)
- Total Expenses (all cutoffs combined)
- Total Savings (salary − expenses)
- Style this row with a slightly darker background to distinguish it

---

## Empty State

- If no history records exist, show: *"No budget history yet. Create your first budget to get started."*
- Include a link to `/budget/new`

---

## Data Fetching

- Fetch all `budget_months` for the user, ordered by year DESC, month DESC
- For each `budget_month`, fetch all `cutoffs` and `budget_items`
- Show a loading skeleton while fetching
- Handle errors with an inline message

---

## Responsive Layout

- Tables scroll horizontally on mobile if content overflows
- Year headings and month headers remain full width
- Export to PDF button stacks below the month label on small screens
