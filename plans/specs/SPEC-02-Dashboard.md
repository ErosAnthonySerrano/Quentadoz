# SPEC-02: Dashboard
## Quentadoz — Feature Specification

---

## Overview

The dashboard is the main page of Quentadoz (`/dashboard`). It shows the current month's budget data through a set of widgets. If no budget has been created yet, it shows a welcome empty state.

**Route:** `/dashboard` — Protected. Redirect to `/auth/login` if unauthenticated.

---

## Empty State (New Account)

- Show a centered welcome message: *"Welcome to Quentadoz! Start by adding your budget for this month."*
- Show a prominent "Add Budget" button that links to `/budget/new`
- Do not show any widgets in empty state

---

## Dashboard Widgets

When budget data exists for the current month, display the following four widgets:

### Widget 1: Cutoff Salary Overview

- Shows one card per cutoff (e.g. 1st Cutoff, 2nd Cutoff)
- Each card displays: cutoff label (e.g. "1st Cutoff"), date, and salary amount
- Cards are displayed in a horizontal row on desktop, stacked on mobile
- Use `text-accent` for the salary amount value

### Widget 2: Total Summary

- Displays total combined salary across all cutoffs
- Displays total savings (total salary minus total expenses for the month)
- Use a 2-column layout for these two values inside a single card
- Savings shown in `text-due-safe` if positive, `text-due-danger` if negative

### Widget 3: Current Month Expenses Table

A table listing all budget items for the current month with the following columns:

| Column | Description |
|---|---|
| Name | Item name (e.g. Netflix, Grocery) |
| Amount | Formatted as currency (PHP) |
| Due Date | Formatted as Month DD, YYYY |
| Status | Badge: Paid (green) or Unpaid (gray) |
| Action | Button labeled "Change Status" — toggles between paid and unpaid |

**Due date row color coding** (applied to the row background):

| Condition | Color Token | Meaning |
|---|---|---|
| Due date > 15 days away | `bg-due-safe-bg` + `text-due-safe` | Safe (green) |
| Due date 9–14 days away | `bg-due-medium-bg` + `text-due-medium` | Moderate (blue) |
| Due date 5–8 days away | `bg-due-warning-bg` + `text-due-warning` | Warning (yellow) |
| Due date < 5 days away or past | `bg-due-danger-bg` + `text-due-danger` | Urgent (red) |

### Widget 4: Monthly Summary

- Shows a breakdown per cutoff: cutoff label, total expenses for that cutoff, remaining balance
- Final row shows totals across all cutoffs: total expenses and total savings for the month
- Remaining balance = cutoff salary − total cutoff expenses

---

## Alert Banner

- Displayed at the very top of the dashboard, above all widgets
- Shown only when there are items in the danger zone (due date < 5 days) with status `unpaid`
- Message: *"You have [N] bill(s) due soon. Please review and mark them as paid."*
- Style: `bg-due-danger-bg text-due-danger` with a warning icon
- Dismissible — user can close it, but it reappears on next page load if bills are still unpaid

---

## Data Fetching

- On page load, fetch the current month's `budget_month` record for the logged-in user
- If no record exists for current month/year, show empty state
- Fetch all `cutoffs` and `budget_items` for the current `budget_month`
- Use Supabase client in a React Server Component or client component with `useEffect`
- Show a loading skeleton for each widget while data is fetching
- Handle fetch errors gracefully with an inline error message

---

## Change Status Action

- Clicking "Change Status" button calls a Supabase update on the `budget_item` row
- Toggles `status` between `'paid'` and `'unpaid'`
- Update the UI optimistically (update local state immediately, then confirm from server)
- Show a brief success toast notification on successful update
- Show an error toast if the update fails, and revert the optimistic state

---

## Responsive Layout

- **Mobile:** widgets stack vertically, full width
- **Tablet (md):** Widgets 1 and 2 side by side, Widgets 3 and 4 full width
- **Desktop (lg):** 2-column grid for Widgets 1–2 and 4, Widget 3 full width
