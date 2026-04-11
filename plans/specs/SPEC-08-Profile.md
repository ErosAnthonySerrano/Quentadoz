# SPEC-08: Profile & Settings
## Quentadoz — Feature Specification

---

## Overview

The Profile Settings page allows users to view their account information, change their password, sign out, and permanently delete their account.

**Route:** `/profile` — Protected. Accessible by clicking the user icon in the navigation bar.

---

## Page Sections

### Account Information

- Display the user's email address (read-only)
- Display the authentication provider (e.g. "Email & Password" or "Google OAuth")
- Display account creation date

### Budget Defaults

- Allows the user to set default values that are auto-applied when creating a **new** budget
- **Default Cutoff Count** — number stepper (1–10) sets how many cutoffs are pre-selected in Step 1
- **Per-Cutoff Defaults** — for each cutoff (based on default count):
  - **Default Salary (₱)** — amount pre-filled in the salary field
  - **Credit Day of Month** — day (1–31); used to generate the credit date for the selected budget month. If the day doesn't exist in the chosen month (e.g. day 31 in February), the field is left blank for the user.
- Saved as an upsert to the `user_defaults` table
- Applied automatically in `BudgetForm` `goToStep2()` when starting fresh (no reuse selection)

### Change Password

- Only shown for users who signed up with email and password (not Google OAuth users)
- Button labeled "Send Password Reset Email"
- Clicking it calls `supabase.auth.resetPasswordForEmail(userEmail)`
- Show success message: *"A password reset link has been sent to your email."*
- Do not show a form for entering the new password here — that happens via the email link on `/auth/reset-password`

### Sign Out

- Button labeled "Sign Out"
- Clicking it calls `supabase.auth.signOut()`
- Clears all Zustand stores
- Redirects to `/auth/login`

### Danger Zone: Delete Account

- Section at the bottom of the page with a red-tinted background
- Label: "Delete Account"
- Warning text: *"This action is permanent and cannot be undone. All your budget data will be deleted."*
- Button: "Delete My Account" — styled in danger color
- Clicking opens a confirmation modal with the message: *"Are you sure? Type DELETE to confirm."*
- User must type the word `DELETE` exactly to enable the confirm button
- On confirm: call the server-side delete API route
- After deletion, redirect to `/auth/signup` with message: *"Your account has been deleted."*

---

## Delete Account Implementation

- Create an API route: `DELETE /api/account`
- The route uses the Supabase service role key to call `supabase.auth.admin.deleteUser(userId)`
- Supabase cascade deletes all related rows due to `ON DELETE CASCADE` on `budget_months` and `budget_items`
- Return `200` on success, `500` on failure

> **Note:** Never call `deleteUser` from the client — it requires the service role key which must stay server-side.

---

## UI Requirements

- Clean, card-based layout with clear section separators
- Danger Zone section visually distinct — subtle red/danger border or background tint
- All destructive actions (delete account, sign out) require a confirmation step
- Show loading state on all buttons while async actions are in progress
- Fully responsive — all sections stack vertically on mobile
