# SPEC-18: Savings Goals
## Quentadoz — Feature Specification

---

## Overview

Savings Goals allow users to define financial targets — a vacation fund, emergency fund, new gadget, down payment — and allocate a portion of their monthly savings toward each goal. The dashboard shows progress rings per active goal. Users can contribute to goals manually each month as part of their budget, and the system tracks progress until the goal is reached.

---

## New Database Table: `savings_goals`

```sql
create table savings_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  target_date date null,
  icon text null,
  color text null,
  is_completed boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table savings_goals enable row level security;
create policy "own goals" on savings_goals
  for all using (auth.uid() = user_id);
```

### Fields explanation

| Field | Notes |
|---|---|
| `name` | e.g. "Japan Trip", "Emergency Fund" |
| `target_amount` | The total amount the user wants to save |
| `current_amount` | Running total of all contributions so far |
| `target_date` | Optional deadline |
| `icon` | Emoji or icon name selected by user (e.g. "✈️", "🏥") |
| `color` | User-selected accent color for this goal's ring |
| `is_completed` | Set to true when `current_amount >= target_amount` |

---

## New Database Table: `goal_contributions`

Tracks each monthly contribution to a goal, linking it to a budget month.

```sql
create table goal_contributions (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references savings_goals(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_month_id uuid references budget_months(id) on delete set null,
  amount numeric(12,2) not null,
  month int not null,
  year int not null,
  note text null,
  created_at timestamptz default now()
);

alter table goal_contributions enable row level security;
create policy "own contributions" on goal_contributions
  for all using (auth.uid() = user_id);
```

---

## Where Goals Are Managed

### Goals management page / profile section
Goals are created and managed from a **new "Savings Goals" section in `/profile`** — not inside the budget form. This keeps the budget form focused on monthly expenses.

The profile page gains a new "Savings Goals" tab or section below Budget Defaults:

```
[ Account ]  [ Budget Defaults ]  [ Savings Goals ]
```

#### Goal list
- Shows all active goals with progress bars
- Shows completed goals in a collapsed "Achieved" section
- "New Goal" button opens a modal

#### New/Edit Goal Modal fields

| Field | Type | Required |
|---|---|---|
| Goal name | Text | Yes |
| Target amount | Numeric | Yes |
| Target date | Date picker | No |
| Icon | Emoji picker (small grid) | No |
| Color | Color swatch selector (6 preset options) | No |

---

## Monthly Contribution Flow

Each month, users can contribute to their goals **from the dashboard**. This is how goals connect to the monthly budget.

### Contribution UI on Dashboard

The Savings Goals widget (see below) has a **"+ Contribute"** button per goal. Clicking it opens a small inline input:

```
[Japan Trip]  ₱8,000 / ₱50,000
+ Contribute  [₱_______]  [Save]
```

- User enters an amount and clicks Save
- A `goal_contributions` record is created linked to the current `budget_month_id`
- `savings_goals.current_amount` is updated: `current_amount + contribution`
- If `current_amount >= target_amount`, `is_completed` is set to `true` and a celebration state is shown
- The contribution is **not** automatically added to the budget expense items — it is tracked separately as a savings allocation

> **Design decision:** Contributions are not deducted from the budget automatically to avoid complexity. The user manages their savings allocation themselves. A future version could add a "deduct from budget savings" option.

### Editing and deleting contributions
- From the goal detail view (accessible by clicking a goal), users can see all contributions by month
- Individual contributions can be deleted, which also decrements `current_amount`

---

## Dashboard Widget: Savings Goals

### Placement
Below the Installments widget. Full width, scrollable if many goals.

### Widget layout

#### Header
```
Savings Goals                    [Manage Goals →]
```

#### Per-goal card
```
✈️  Japan Trip                         [+ Contribute]
    ₱8,000 saved of ₱50,000 target
    ████░░░░░░░░░░░░░░░░  16%
    Target: December 2025 · ₱42,000 remaining
```

- Progress ring (circular) or progress bar — circular ring preferred for visual richness
- Ring color uses the goal's selected color
- If target date is set, show a "on track" or "behind" indicator:
  - On track: muted green text — *"On track"*
  - Behind: muted warning text — *"Behind pace"* (computed from required monthly savings vs recent average)
- Completed goals show a celebration state: full ring, green checkmark, *"Goal achieved! 🎉"*

#### Empty state
*"No savings goals yet. Set a goal and start working toward it."* with a "Create Goal" button linking to `/profile#savings-goals`.

### Max goals shown on dashboard
Show up to 3 active goals. If more exist, show a "View all [N] goals →" link that opens a full goals list modal or navigates to profile.

---

## On-Track Calculation

```ts
function isOnTrack(goal: SavingsGoal, today: Date): 'on_track' | 'behind' | 'no_deadline' {
  if (!goal.target_date) return 'no_deadline'

  const monthsRemaining = monthsBetween(today, new Date(goal.target_date))
  if (monthsRemaining <= 0) return 'behind'

  const amountRemaining = goal.target_amount - goal.current_amount
  const requiredPerMonth = amountRemaining / monthsRemaining

  // Get average monthly contribution over last 3 months
  const recentAvg = computeRecentContributionAverage(goal.contributions, 3)

  return recentAvg >= requiredPerMonth ? 'on_track' : 'behind'
}
```

---

## Components to Create or Modify

| File | Change |
|---|---|
| `src/app/(app)/profile/page.tsx` | Add Savings Goals section/tab |
| `src/components/profile/SavingsGoalsList.tsx` | New — goal list in profile |
| `src/components/profile/SavingsGoalModal.tsx` | New — create/edit goal modal |
| `src/components/widgets/SavingsGoalsWidget.tsx` | New — dashboard widget with rings |
| `src/app/(app)/dashboard/page.tsx` | Fetch goals + contributions, pass to widget |
| `src/utils/budget.ts` | Add `isOnTrack()`, `computeRecentContributionAverage()`, `monthsBetween()` |
| `src/types/index.ts` | Add `SavingsGoal`, `GoalContribution` interfaces |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| User contributes more than remaining amount | Allowed — `current_amount` can exceed `target_amount`, goal marked complete |
| User deletes a budget month with contributions | `budget_month_id` on contributions set to null (ON DELETE SET NULL), contributions still count |
| Target date has passed, goal not complete | Show "Overdue" badge in warning color |
| User has no budget for current month | "Contribute" button still works — `budget_month_id` is null on contribution |
| Goal is completed | Card shows celebration state, "Contribute" button hidden |
| User deletes a goal | All contributions deleted via cascade, `current_amount` history lost |

---

## UI Requirements

- Progress rings use SVG circle with `stroke-dasharray` / `stroke-dashoffset` for smooth animation
- Ring fills animate from 0 to current percentage on mount
- Goal colors are chosen from 6 presets (matches design system palette, no free color picker)
- Emoji icon picker shows a small grid of ~20 common savings-related emojis
- Contribution input appears inline in the widget (no modal for quick contributions)
- Full goal management (create, edit, delete, view history) lives in profile to keep dashboard clean
- All amounts formatted with the existing currency formatter
