# Quentadoz Current Technical Snapshot

## Document Purpose
This document is a current-state technical report for the `quentadoz` project as it exists in the repository at the time of writing. It is intended to describe:

- What Quentadoz is right now
- The current user flow and system behavior
- The application stack and architecture
- The branding and theme implementation
- All pages, routes, APIs, shared components, utilities, stores, and supporting files
- The repository structure and the responsibility of each tracked project file

This is a descriptive snapshot, not a proposal. It documents the implemented system as found in code.

## What Quentadoz Is
Quentadoz is a personal budgeting web application centered around the concept of multiple salary cutoffs within a single month. Instead of treating a month as one undivided budget pool, the system models a month as a set of cutoff periods, each with:

- A salary amount
- A credit date
- A set of expense items
- A paid or unpaid status per item

The current product supports:

- Email/password authentication
- Google OAuth authentication
- Email confirmation
- Password reset
- Current-month dashboard view
- New budget creation
- Budget reuse from previous or selected months
- Budget editing
- Per-cutoff salary and expense tracking
- Expense paid/unpaid toggling
- Budget history browsing and filtering
- PDF export of historical budgets
- AI-assisted receipt/document parsing using Gemini
- User budget defaults in profile settings
- Theme toggle with light and dark modes
- PWA manifest support
- Account deletion

At a product level, Quentadoz is currently a budgeting tracker with AI-assisted input, historical reporting, and multi-cutoff monthly structure.

## Current High-Level Flow
### Entry and access control
1. The root URL `/` redirects to `/auth/login`.
2. Middleware checks authentication state using Supabase SSR.
3. Unauthenticated users attempting to visit protected routes are redirected to login.
4. Authenticated users attempting to visit login or signup are redirected to dashboard.

### Authentication flow
1. User signs in with email/password or Google OAuth.
2. Signup requires email confirmation.
3. Confirmation links exchange the auth code for a session and redirect to dashboard.
4. Forgot-password sends a reset email.
5. Reset-password updates the current user password.

### Main application flow
1. Authenticated users land on `/dashboard`.
2. Dashboard loads the current month's `budget_month` record for the user.
3. If there is no current-month budget, the app shows an empty state with a CTA to create one.
4. If a budget exists, the dashboard shows:
   - Due-soon alerting
   - Cutoff salary overview
   - Total summary
   - Expense list grouped by active cutoff
   - Monthly summary

### Budget creation flow
1. User opens `/budget/new`.
2. Step 1 sets cutoff count and checks for previous/current month budgets.
3. The form can prefill from:
   - Previous month data
   - A specific reused budget via `?reuse=<budgetMonthId>`
   - User default cutoff settings from profile
4. Step 2 captures month/year, cutoffs, salaries, credit dates, items, and optional custom columns.
5. AI parsing can inject items globally or into a specific cutoff.
6. Items can be divided across multiple cutoffs.
7. Submit creates a `budget_month`, related `cutoffs`, and related `budget_items`.

### Budget editing flow
1. User opens `/budget/[id]/edit`.
2. The page loads the target budget month plus its cutoffs and items.
3. The same `BudgetForm` is reused in `edit` mode.
4. Submit updates the month, cutoffs, and item records, deletes removed records, and inserts new records.

### History flow
1. User opens `/history`.
2. The page loads all `budget_months` for the user.
3. Related cutoffs and items are fetched and grouped into records.
4. User can filter by year and month range.
5. Each month record supports:
   - Reuse
   - Export PDF
   - Edit

### Profile/settings flow
1. User opens `/profile`.
2. Page loads auth user details and `user_defaults`.
3. User can configure default cutoff count, salary, and credit day per cutoff.
4. Email users can request a password reset email.
5. User can sign out.
6. User can permanently delete the account via `/api/account`.

## Functional Scope by Area
### 1. Authentication
- Login with email/password
- Signup with email/password
- Google OAuth sign-in/signup
- Email confirmation handling
- Forgot password
- Reset password
- Redirect protection via middleware and in-app auth checks

### 2. Dashboard
- Current month detection
- Current month budget lookup
- Empty-state fallback when no current month budget exists
- Due-soon banner based on unpaid items close to due date
- Salary totals
- Savings totals
- Cutoff-by-cutoff salary overview
- Cutoff expense table with status toggling
- Monthly summary bars and breakdown
- Toast notifications for status updates and errors

### 3. Budget authoring
- New budget creation
- Edit existing budget
- Reuse a previous or selected budget
- Step-driven setup
- Dynamic number of cutoffs
- Per-cutoff salary and date
- Dynamic items per cutoff
- Dynamic custom columns per cutoff
- AI parsing of receipts/documents
- Out-of-range AI cutoff handling
- Divide one item into multiple cutoffs
- Date remapping when month/year changes

### 4. History
- Load all user budget months
- Group historical records by year
- Filter by year, start month, end month
- Desktop table and mobile card layouts
- Reuse a prior month as a new budget template
- Export a budget summary to PDF
- Navigate to edit

### 5. Profile/settings
- View account email, provider, created date
- Manage user budget defaults
- Send password reset email
- Sign out via server action
- Delete account via API

### 6. AI parser
- Accept storage URL plus cutoff count
- Support text, image, and PDF sources
- Use Gemini to extract expenses
- Return normalized item arrays
- Preserve optional cutoff assignments if detected in the source document

### 7. Exporting/reporting
- PDF export for any historical monthly record
- Includes logo, cutoff sections, per-item rows, summary rows, and footer

### 8. Theming and branding
- Light theme
- Dark theme
- Persistent localStorage theme selection
- Theme-aware logos
- Theme-aware page background
- Tokenized brand colors in global CSS

## Technical Stack
### Framework and runtime
- Next.js `16.2.3`
- React `19.2.4`
- React DOM `19.2.4`
- TypeScript `5`

### Styling
- Tailwind CSS `v4` via `@import "tailwindcss"`
- Global token-based theme variables in `src/app/globals.css`
- Brand-aware light/dark mode using `[data-theme="dark"]`

### Forms and validation
- React Hook Form `7.72.1`
- Zod `4.3.6`
- `@hookform/resolvers`

### State management
- Zustand `5.0.12`

### Backend and auth
- Supabase SSR
- Supabase JS client
- Supabase Auth
- Supabase database tables inferred from usage:
  - `budget_months`
  - `cutoffs`
  - `budget_items`
  - `user_defaults`

### AI integration
- `@google/generative-ai`
- Gemini model currently configured as `gemini-3.1-flash-lite-preview`

### PDF/reporting
- `@react-pdf/renderer`

### Charts and icons
- `recharts` is installed but not currently visible in the inspected source paths
- `react-icons`

### Tooling
- ESLint `9`
- `eslint-config-next`
- `cross-env`
- PostCSS with `@tailwindcss/postcss`

## Architecture Overview
### App Router structure
The application uses the Next.js App Router. Routes are split into:

- Root app shell: `src/app/layout.tsx`
- Auth pages: `src/app/auth/*`
- Protected app pages under route group: `src/app/(app)/*`
- API routes: `src/app/api/*`
- Server action: `src/app/actions/auth.ts`

### Rendering model
- Most pages are client components
- Auth checks happen in both middleware and client page/layout logic
- Shared layouts wrap app pages
- PDF generation is performed client-side through a dynamic import in history export flow

### Data flow model
- Supabase auth session determines access
- Pages fetch directly from Supabase in client components
- Forms submit directly to Supabase using the browser client
- Sensitive account deletion uses a server-side API route with service role key
- AI parsing is proxied through a server route

## Current Branding and Theme System
### Current brand direction
Quentadoz currently uses a navy-and-teal identity.

Primary palette defined in `globals.css`:

- Deep Navy: `#0E2036`
- Teal Green: `#13AE83`
- Off-White: `#F8F8F8`
- Near-Black: `#191919`

### Typography
- Primary font: `Nunito`
- Secondary font: `Montserrat`

### Logo usage
- Auth pages use brand wordmark images:
  - `Quentadoz Main Brand.png`
  - `Quentadoz Dark Brand.png`
- Main app navigation uses theme-aware main logos:
  - `Quentadoz Main Logo Light.png`
  - `Quentadoz Main Logo Dark.png`
- PDF export currently uses:
  - `Quentadoz Main Logo Light.png`

### Theme behavior
- Theme is stored in `localStorage` under `quentadoz-theme`
- Root layout sets `data-theme` before hydration to avoid flashing
- Theme toggling updates document attribute and local storage
- Light and dark assets switch with `theme-light-only` and `theme-dark-only`

## Data Model
### `BudgetMonth`
Represents one monthly budget container per user.

Fields observed:
- `id`
- `user_id`
- `month`
- `year`
- `cutoff_count`
- `created_at`

### `Cutoff`
Represents one salary cutoff inside a budget month.

Fields observed:
- `id`
- `budget_month_id`
- `cutoff_number`
- `salary`
- `date`

### `BudgetItem`
Represents one budget item/expense.

Fields observed:
- `id`
- `user_id`
- `budget_month_id`
- `cutoff_id`
- `name`
- `amount`
- `due_date`
- `status`
- `custom_fields`
- `created_at`

### `UserDefault`
Represents reusable per-user default cutoff configuration.

Fields observed:
- `id`
- `user_id`
- `cutoff_count`
- `cutoffs`
- `created_at`
- `updated_at`

### `ParsedReceiptItemWithCutoff`
AI parser response object.

Fields:
- `name`
- `amount`
- `due_date`
- `cutoff_number`

## Current Page and Route Inventory
### Public/auth routes
- `/`
  - Redirects to `/auth/login`
- `/auth/login`
  - Email/password login
  - Google OAuth login
  - Forgot password link
- `/auth/signup`
  - Email/password signup
  - Google OAuth signup
  - Password strength meter
  - Success state after signup
- `/auth/forgot-password`
  - Sends password reset email
- `/auth/reset-password`
  - Updates user password
- `/auth/confirm`
  - Confirms email link by exchanging auth code for session
- `/auth/callback`
  - Route handler for OAuth callback and code exchange

### Protected app routes
- `/dashboard`
  - Current month overview and widgets
- `/history`
  - Historical month browser with export/reuse/edit
- `/profile`
  - Account settings, defaults, password reset trigger, sign-out, delete
- `/budget/new`
  - New budget flow
- `/budget/[id]/edit`
  - Edit existing budget flow

### API routes
- `/api/parse-receipt`
  - AI parsing endpoint
- `/api/account`
  - Account deletion endpoint

## Current User Experience Flow Details
### Login and signup
- Login form validates with Zod
- Signup form validates password/confirm password
- Google OAuth redirects to `/auth/callback`
- Email confirmation is required for email signups

### Dashboard behavior
- Loads only the current month, based on client `Date`
- If no current month record exists, user is prompted to create one
- Paid/unpaid toggling is optimistic
- Toasts report success/failure
- Due-soon banner triggers when unpaid items are in danger range

### Budget creation/edit behavior
- `BudgetForm` is the main orchestration component
- Supports `new` and `edit` modes
- Supports `reuseId` query parameter
- Step 1:
  - set cutoff count
  - inspect previous/current budget availability
  - optionally load previous or reused record into the form
- Step 2:
  - manage month/year
  - manage cutoff cards and item tables
  - add/remove custom columns
  - AI parsing and item insertion
  - divide items across cutoffs
- Step 3:
  - confirmation and submit
- On create:
  - insert `budget_month`
  - insert `cutoffs`
  - insert `budget_items`
- On edit:
  - update month metadata
  - delete removed cutoffs/items
  - update existing cutoffs/items
  - insert new cutoffs/items

### History behavior
- Loads every budget month for the authenticated user
- Builds month records from joined `budget_months`, `cutoffs`, and `budget_items`
- Filters are purely client-side after load
- Export PDF uses a dynamic import to avoid loading PDF code up front

### Profile behavior
- Budget defaults are stored in `user_defaults`
- Default cutoff count can range from `1` to `31`
- Each default cutoff supports:
  - default salary
  - credit day of month
- Delete account performs a destructive auth admin delete
- Sign out is implemented as a server action

## Security and Access Control
### Route protection
Protection is implemented in `middleware.ts`:

- Protected prefixes:
  - `/dashboard`
  - `/history`
  - `/profile`
  - `/budget`
- Auth routes:
  - `/auth/login`
  - `/auth/signup`

### Secondary client-side protection
- `(app)/layout.tsx` re-checks auth on mount
- Edit/new/profile pages also re-check user state before data operations

### Sensitive operations
- Account deletion uses service-role Supabase admin client on the server
- AI parse route verifies user auth before processing

### Current security note
`.env.local` exists in the repo working tree and contains:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

This file should be treated as sensitive configuration and should not be committed or shared publicly.

## Current Non-Functional Characteristics
### Responsiveness
- Many components explicitly support desktop and mobile layouts
- Navigation has distinct desktop top bar and mobile bottom nav
- Dashboard widgets adapt between stacked and grid layouts
- History page has separate desktop and mobile render strategies

### Progressive enhancement
- PWA manifest is configured
- Apple touch icon and theme-color metadata are configured

### Loading and empty states
- Dashboard skeleton
- History skeleton
- Empty state for missing current budget
- Loading gate in app layout

### Toast feedback
- Reusable success/error toast system is used across dashboard, profile, history, and forms

## Repository File Inventory
The list below describes every tracked project file and its current role, excluding generated dependency/build directories such as `node_modules`, `.next`, `.git`, and `tsconfig.tsbuildinfo`.

### Root configuration and repo files
- `.env.local`
  - Local environment variables for Supabase and Gemini.
- `.gitignore`
  - Git ignore rules.
- `AGENTS.md`
  - Agent-oriented repo instructions.
- `CLAUDE.md`
  - Minimal collaborator/agent note file.
- `README.md`
  - Default create-next-app README; not yet updated to reflect the real product.
- `SPEC-04-SETUP.md`
  - Setup-oriented project documentation.
- `package.json`
  - Package metadata, scripts, dependencies, and devDependencies.
- `package-lock.json`
  - Locked dependency tree.
- `next.config.ts`
  - Next.js config; currently defines `allowedDevOrigins`.
- `tsconfig.json`
  - TypeScript config with strict mode and `@/*` path alias.
- `eslint.config.mjs`
  - ESLint config using Next core-web-vitals and TypeScript presets.
- `postcss.config.mjs`
  - PostCSS config for Tailwind integration.
- `next-env.d.ts`
  - Next.js generated TypeScript typings entry.
- `middleware.ts`
  - SSR auth-aware route protection and redirects.
- `proxy.ts`
  - Alternate auth redirect implementation; present in repo but not standard Next middleware entrypoint.

### Memory and planning docs
- `memories/repo/notes.md`
  - Internal notes/memory file for development context.
- `plans/specs/Quentadoz-MASTER-SPEC.md`
  - High-level planning spec for the product.
- `plans/specs/SPEC-01-Auth.md`
  - Planning spec for auth.
- `plans/specs/SPEC-02-Dashboard.md`
  - Planning spec for dashboard.
- `plans/specs/SPEC-03-BudgetForm.md`
  - Planning spec for budget form flow.
- `plans/specs/SPEC-04-AIParser.md`
  - Planning spec for AI parsing.
- `plans/specs/SPEC-05-History.md`
  - Planning spec for history.
- `plans/specs/SPEC-06-PDFExport.md`
  - Planning spec for PDF export.
- `plans/specs/SPEC-07-ThemeToggle.md`
  - Planning spec for theme toggle.
- `plans/specs/SPEC-08-Profile.md`
  - Planning spec for profile/settings.
- `plans/specs/SPEC-09-AIMultiCutoff.md`
  - Planning spec for multi-cutoff AI parsing behavior.

### Public assets
- `public/manifest.json`
  - PWA manifest with app name, icons, start URL, orientation, theme/background colors.
- `public/Quentadoz Main Brand.png`
  - Light theme auth brand asset.
- `public/Quentadoz Dark Brand.png`
  - Dark theme auth brand asset.
- `public/Quentadoz Main Logo Light.png`
  - Light theme main navigation and PDF logo.
- `public/Quentadoz Main Logo Dark.png`
  - Dark theme main navigation logo.
- `public/icons/apple-touch-icon.png`
  - Apple web app icon.
- `public/icons/icon-192x192.png`
  - PWA icon.
- `public/icons/icon-512x512.png`
  - PWA icon.
- `public/file.svg`
  - Generic asset from base scaffold; not core product branding.
- `public/globe.svg`
  - Generic asset from base scaffold.
- `public/next.svg`
  - Generic Next.js asset.
- `public/vercel.svg`
  - Generic Vercel asset.
- `public/window.svg`
  - Generic scaffold asset.

### App shell and global styling
- `src/app/layout.tsx`
  - Root layout, metadata, PWA head tags, pre-hydration theme setup, page background wrapper.
- `src/app/page.tsx`
  - Root redirect page to login.
- `src/app/globals.css`
  - Global design tokens, light/dark theme variables, base styles, shared utility classes, component shell classes.
- `src/app/favicon.ico`
  - App favicon.

### App route group layout
- `src/app/(app)/layout.tsx`
  - Protected app layout with auth check, navbar, spacing, and content container rules.

### Auth pages and routes
- `src/app/auth/login/page.tsx`
  - Login page with email/password and Google OAuth.
- `src/app/auth/signup/page.tsx`
  - Signup page with password strength and success state.
- `src/app/auth/forgot-password/page.tsx`
  - Forgot-password page.
- `src/app/auth/reset-password/page.tsx`
  - Reset-password page.
- `src/app/auth/confirm/page.tsx`
  - Email confirmation client page.
- `src/app/auth/callback/route.ts`
  - OAuth callback route for code exchange and redirect.

### Protected pages
- `src/app/(app)/dashboard/page.tsx`
  - Current month dashboard; fetches user budget data and composes dashboard widgets.
- `src/app/(app)/history/page.tsx`
  - Budget history with filters, grouping, reuse, export, and edit actions.
- `src/app/(app)/profile/page.tsx`
  - Account info, defaults, password reset, sign out, and delete account.
- `src/app/(app)/budget/new/page.tsx`
  - New budget page wrapper around `BudgetForm`.
- `src/app/(app)/budget/[id]/edit/page.tsx`
  - Edit budget page wrapper around `BudgetForm`.

### Server actions and API routes
- `src/app/actions/auth.ts`
  - Server action for sign-out and layout revalidation.
- `src/app/api/parse-receipt/route.ts`
  - Authenticated AI parsing endpoint for receipt/document extraction.
- `src/app/api/account/route.ts`
  - Authenticated account deletion endpoint using Supabase admin delete.

### Shared UI components
- `src/components/ui/BrandLogo.tsx`
  - Theme-aware auth logo component.
- `src/components/ui/Button.tsx`
  - Shared button primitive with variants and loading state.
- `src/components/ui/Input.tsx`
  - Shared labeled input with error display.
- `src/components/ui/PasswordInput.tsx`
  - Shared password input with visibility toggle.
- `src/components/ui/Navbar.tsx`
  - Main app navigation with desktop/mobile variants, theme toggle, profile badge, and app logo.
- `src/components/ui/PageBackground.tsx`
  - Brand-themed decorative page background with theme-aware wave gradients.
- `src/components/ui/Toast.tsx`
  - Toast state hook and container renderer.

### Form components
- `src/components/forms/BudgetForm.tsx`
  - Core budget authoring engine for create/edit/reuse/defaults/AI/divide flows.
- `src/components/forms/CutoffSection.tsx`
  - Per-cutoff form UI, item table/cards, custom columns, and cutoff-level AI insertion.
- `src/components/forms/DivideModal.tsx`
  - Modal for splitting an item across multiple cutoffs.
- `src/components/forms/AIUploadModal.tsx`
  - File upload UI for AI parsing.
- `src/components/forms/AIOutOfRangeModal.tsx`
  - Modal for resolving parsed items assigned to non-existent cutoffs.
- `src/components/forms/AICutoffPickerModal.tsx`
  - Modal for selecting a target cutoff for AI items when needed.
- `src/components/forms/budgetFormSchema.ts`
  - Zod schemas and empty value factories for budget form data.

### Dashboard and data-display widgets
- `src/components/widgets/CutoffSalaryWidget.tsx`
  - Cutoff salary overview cards.
- `src/components/widgets/TotalSummaryWidget.tsx`
  - Total salary, savings, and circular savings-rate summary.
- `src/components/widgets/ExpensesTableWidget.tsx`
  - Cutoff expense browser with status changes and pagination.
- `src/components/widgets/MonthlySummaryWidget.tsx`
  - Salary allocation bar, savings/remaining bar, and per-cutoff breakdown.
- `src/components/widgets/DueSoonBanner.tsx`
  - Dismissible due-soon warning banner.
- `src/components/widgets/DashboardSkeleton.tsx`
  - Dashboard loading skeleton.
- `src/components/widgets/EmptyState.tsx`
  - Dashboard empty state for users with no current-month budget.
- `src/components/widgets/ExpenseIdentityBadge.tsx`
  - Name-based expense icon badge/fallback visual generator.

### Libraries
- `src/lib/supabase/client.ts`
  - Browser Supabase client factory.
- `src/lib/supabase/server.ts`
  - Server Supabase client factory using Next cookies.
- `src/lib/gemini.ts`
  - Gemini integration, prompt construction, file fetching, parsing, and Zod validation.
- `src/lib/pdf.tsx`
  - React PDF document definition and browser export function.

### State stores
- `src/store/useThemeStore.ts`
  - Zustand theme state and localStorage persistence.
- `src/store/useBudgetStore.ts`
  - Zustand budget state cache and update helpers.

### Types and utilities
- `src/types/index.ts`
  - Shared TypeScript interfaces for users, budget entities, and AI parse output.
- `src/utils/budget.ts`
  - Currency/date formatting, due-date classification, due status class mapping, and ordinal labels.

## Current Architectural Notes and Observations
### Strengths of the current structure
- Clear separation between auth routes and protected app routes
- Reusable `BudgetForm` for both create and edit
- Good use of shared UI primitives and widgets
- Strong reliance on theme tokens rather than isolated hardcoded component colors
- Meaningful support for mobile and desktop layouts
- AI parser integrated without hard-coupling model logic into form UI

### Current codebase characteristics
- Most data fetching is client-side rather than server components
- Supabase table usage is implicit in code; no migrations/schema files are present in the inspected repo
- There is some duplicated auth guarding between middleware and client layouts/pages
- `proxy.ts` appears to overlap conceptually with `middleware.ts`
- The root README is still scaffold/default and not project-specific

### Missing or not present in the inspected repo
- No database migration files
- No automated test suite files were found
- No CI workflow files were inspected in detail
- No custom server code beyond Next route handlers

## Summary
Quentadoz is currently a multi-cutoff personal budgeting application built with Next.js, React, Supabase, Tailwind v4, Zod, React Hook Form, Zustand, Gemini, and React PDF. It supports authentication, month-based budgeting, reusable/editable cutoff structures, AI-assisted item extraction, historical tracking, PDF export, profile defaults, theming, and account lifecycle actions.

The implementation is componentized around a protected app shell, a substantial shared `BudgetForm`, dashboard widgets, and client-side Supabase-driven pages. Branding has already been reworked into a navy/teal token system with theme-aware logo assets and a custom page background. The repository also includes prior planning specs under `plans/specs`, while this document captures the implemented current state.
