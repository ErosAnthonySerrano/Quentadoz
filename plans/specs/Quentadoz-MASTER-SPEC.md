# Quentadoz — Budgeting Web Application
## Master Product Specification · v1.0

---

## 1. Project Overview

Quentadoz is a personal budgeting web application designed for users who receive salaries in multiple cutoffs per month. It provides a structured way to track income, expenses, and savings per cutoff period, with an AI-powered receipt/image parser to reduce manual data entry. The app is fully responsive, supports light and dark mode, and exports monthly budget summaries to PDF.

**Core goals:**

- Track salary and expenses across 1 to 4+ cutoff periods per month
- Reduce repetitive monthly data entry via budget reuse and AI image parsing
- Provide clear visibility into due dates, payment statuses, and remaining balances
- Allow users to export history to PDF for record keeping
- Be accessible on desktop and mobile with a polished, non-generic design

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS | UI, routing, SSR |
| State | Zustand | Client-side global state |
| Forms | React Hook Form + Zod | Form handling and validation |
| Charts | Recharts | Dashboard data visualizations |
| Icons | React Icons | All iconography |
| PDF Export | @react-pdf/renderer | Client-side PDF generation |
| Auth + DB + Storage | Supabase | PostgreSQL, Auth (OAuth + email), file storage |
| AI Vision | Google Gemini API (Flash) | Receipt and image parsing |
| Hosting | Vercel (free tier) | Auto-deploy from GitHub |
| Repo | GitHub | Version control |

---

## 3. Design System

### 3.1 Styling Approach

All styling uses **Tailwind CSS v4 with `@theme inline`**. Colors, radii, and shadows are defined as CSS custom properties inside `@theme inline` in `src/app/globals.css`. Tailwind generates utility classes (e.g. `bg-card`, `text-accent`, `border-line`) that reference these variables. Dark mode is applied by overriding the CSS variables under `[data-theme="dark"]`.

**Rules:**
- Always use `className="..."` — never `style={{}}` except for truly dynamic values (e.g. animated widths)
- Never use generic Tailwind color classes like `green-500`, `blue-200`, `red-400`, etc.
- Use the semantic token classes below

### 3.2 Tailwind Token Classes

| Class | Light Value | Dark Value | Usage |
|---|---|---|---|
| `bg-page` | #f8f7f4 | #1c1c1a | Page background |
| `bg-card` | #ffffff | #2a2a28 | Card / widget background |
| `bg-surface` | #f1efe9 | #323230 | Subtle surface, hover states |
| `bg-secondary` | #ffffff | #252523 | Input backgrounds |
| `text-header` | #1a1917 | #f0ede6 | Page titles, H1 |
| `text-title` | #2d2c29 | #d8d5ce | Section titles, H2 |
| `text-body` | #4a4945 | #b0ada6 | Body copy |
| `text-muted` | #8a8880 | #706e68 | Labels, secondary info |
| `bg-accent` / `text-accent` | #2a6e4e | #4aab7e | Primary action color |
| `hover:bg-accent-hover` | #1f5439 | #5bc490 | Accent hover |
| `bg-accent-light` | #e6f2ec | #1a3328 | Accent tint backgrounds |
| `bg-due-safe-bg` / `text-due-safe` | #e6f2ec / #2a6e4e | #1a3328 / #4aab7e | Due > 15 days |
| `bg-due-medium-bg` / `text-due-medium` | #e8f3fb / #1a6fa8 | #112840 / #5aaee0 | Due 9–14 days |
| `bg-due-warning-bg` / `text-due-warning` | #fef8e7 / #b07d12 | #2a2010 / #d4a030 | Due 5–8 days |
| `bg-due-danger-bg` / `text-due-danger` | #fdf0ef / #c0392b | #2e1210 / #e05a4a | Due < 5 days |
| `border-line` | #e4e2db | #3a3a38 | Standard border |
| `border-line-light` | #eeece6 | #2e2e2c | Subtle divider |
| `rounded-sm` | 6px | — | Badges |
| `rounded-md` | 10px | — | Inputs, buttons |
| `rounded-lg` | 14px | — | Cards, modals |
| `shadow-card` | subtle 1px elevation | — | Card shadow |

### 3.3 Typography

- H1: `text-[28px] font-semibold text-header`
- H2: `text-[22px] font-semibold text-header`
- Body: `text-sm text-body` (14px)
- Muted: `text-xs text-muted` (12px)
- Weights: `font-normal` (400), `font-medium` (500), `font-semibold` (600)

### 3.4 Dark Mode

- Applied via `data-theme="dark"` on `<html>`
- Anti-flash inline script reads `localStorage` before first render
- Token classes automatically respond to dark mode — no `dark:` prefix needed
- Never use pure black — minimum dark bg is `#1c1c1a`

---

## 4. Application Pages & Navigation

### 4.1 Navigation Structure

5 items in the navigation bar, consistent across all pages:

| Nav Item | Type | Destination |
|---|---|---|
| Home / Dashboard | Icon + label | /dashboard |
| History | Icon + label | /history |
| Light/Dark toggle | Icon button | Toggles theme in place |
| User icon | Icon button | Redirects to /profile |
| Add Budget (top right) | Button | Redirects to /budget/new |

### 4.2 Pages Summary

| Page | Route | Description |
|---|---|---|
| Login / Sign Up | /auth/login, /auth/signup | Auth entry point |
| Dashboard | /dashboard | Monthly budget overview with widgets |
| Budget Form | /budget/new, /budget/[id]/edit | Create or edit a monthly budget |
| History | /history | View past budgets with filters and PDF export |
| Profile Settings | /profile | Change password, delete account |

---

## 5. Database Schema

### 5.1 Tables

Users are managed by Supabase Auth. The following application tables are required:

#### budget_months

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK) | References auth.users |
| month | int | 1–12 |
| year | int | e.g. 2025 |
| cutoff_count | int | How many cutoffs this month (1–4+) |
| created_at | timestamptz | Auto |

#### cutoffs

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| budget_month_id | uuid (FK) | References budget_months |
| cutoff_number | int | 1, 2, 3, 4... |
| salary | numeric(12,2) | Salary amount for this cutoff |
| date | date | Date of salary credit |

#### budget_items

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK) | References auth.users |
| budget_month_id | uuid (FK) | References budget_months |
| cutoff_id | uuid (FK) | Which cutoff this item belongs to |
| name | text | Item name (e.g. Netflix, Grocery) |
| amount | numeric(12,2) | Expense amount |
| due_date | date | When this bill is due |
| status | text | 'paid' or 'unpaid' |
| custom_fields | jsonb | User-defined extra columns |

### 5.2 Row Level Security

- All tables have RLS enabled
- Users can only read, insert, update, and delete their own rows
- Supabase Auth UID is used as the identity key in all policies

---

## 6. Environment Variables

| Variable | Where Used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (API routes) | Yes |
| `GEMINI_API_KEY` | Server only (API routes) | Yes |

---

## 7. Feature Specifications Index

Implement features in the order listed below:

| # | Feature Spec File | Depends On |
|---|---|---|
| 1 | SPEC-01-Auth.md | Supabase setup |
| 2 | SPEC-02-Dashboard.md | Auth, DB schema |
| 3 | SPEC-03-BudgetForm.md | Auth, DB schema |
| 4 | SPEC-04-AIParser.md | Budget Form, Gemini API |
| 5 | SPEC-05-History.md | Budget Form data |
| 6 | SPEC-06-PDFExport.md | History page |
| 7 | SPEC-07-ThemeToggle.md | globals.css tokens |
| 8 | SPEC-08-Profile.md | Auth |

---

## 8. Global Coding Standards

### 8.1 TypeScript

- No use of `any` type — define proper interfaces for all data
- All Supabase query results must be typed using generated or manual types
- All component props must have explicit TypeScript interfaces

### 8.2 Error Handling

- Every data fetch must have a loading state, success state, and error state
- Use fallback values to prevent undefined crashes (e.g. `items ?? []`)
- Show user-friendly error messages — never raw error objects in the UI

### 8.3 Responsiveness

- Mobile-first approach. Breakpoints: sm (640px), md (768px), lg (1024px)
- All widgets must stack vertically on mobile and display in grid on desktop
- Navigation collapses to a bottom nav bar on mobile

### 8.4 File Structure

```
src/
├── app/                        # Next.js App Router pages
├── components/
│   ├── ui/                     # Reusable primitives (Button, Card, Input, Badge)
│   ├── widgets/                # Dashboard-specific widgets
│   └── forms/                  # Form-related components
├── lib/
│   ├── supabase/               # Client and server Supabase instances
│   ├── gemini.ts               # Gemini API call utility
│   └── pdf.ts                  # PDF generation utility
├── store/                      # Zustand stores
├── types/                      # Shared TypeScript interfaces
└── utils/                      # Helper functions (date formatting, currency, due status)
```

### 8.5 Naming Conventions

- Components: PascalCase (`BudgetWidget.tsx`)
- Files: kebab-case (`budget-widget.tsx`) for non-component files
- Functions: camelCase
- Zustand stores: `use[Name]Store` (e.g. `useBudgetStore`)
- CSS classes: use Tailwind `className` for all styling; color tokens are from `@theme inline` (e.g. `bg-card`, `text-accent`); inline `style={{}}` only for dynamic values
