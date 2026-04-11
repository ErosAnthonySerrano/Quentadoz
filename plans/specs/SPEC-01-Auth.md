# SPEC-01: Authentication
## Quentadoz — Feature Specification

---

## Overview

This spec covers all authentication flows: sign up, login, email confirmation, Google OAuth, and password reset. Auth is powered entirely by Supabase Auth.

---

## Routes

| Route | Purpose |
|---|---|
| /auth/login | Login page |
| /auth/signup | Sign up page |
| /auth/callback | OAuth redirect handler (Supabase) |
| /auth/confirm | Email confirmation handler |
| /auth/reset-password | Password reset page |

---

## Sign Up Flow

### Option A: Email + Password

1. User visits `/auth/signup`
2. Enters email address and password (min 8 chars, validated with Zod)
3. On submit, call `supabase.auth.signUp({ email, password })`
4. Supabase sends a confirmation email automatically
5. Show success message: *"Check your email to confirm your account"*
6. User clicks link in email, Supabase redirects to `/auth/confirm`
7. On confirm page, call `supabase.auth.exchangeCodeForSession(code)` from URL params
8. Redirect to `/dashboard` on success

### Option B: Google OAuth

1. User clicks "Continue with Google" button
2. Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`
3. User completes Google sign-in flow
4. Supabase redirects to `/auth/callback`
5. On callback page, `supabase.auth.getSession()` to confirm session
6. Redirect to `/dashboard`

---

## Login Flow

### Option A: Email + Password

1. User visits `/auth/login`
2. Enters email and password
3. Call `supabase.auth.signInWithPassword({ email, password })`
4. On success, redirect to `/dashboard`
5. On error, show inline error: *"Invalid email or password"*

### Option B: Google OAuth

Same OAuth flow as sign up — Supabase handles existing vs new accounts automatically.

---

## Password Reset Flow

1. User clicks "Forgot password?" on login page
2. Enters email address
3. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/auth/reset-password' })`
4. Show message: *"Password reset link sent. Check your email."*
5. User clicks link in email, lands on `/auth/reset-password` with token in URL
6. User enters new password and confirms it
7. Call `supabase.auth.updateUser({ password: newPassword })`
8. Show success and redirect to `/auth/login`

---

## Session & Route Protection

- Create a Supabase middleware (`middleware.ts` at project root) that checks session on every request
- Unauthenticated users hitting any protected route are redirected to `/auth/login`
- Authenticated users hitting `/auth/login` or `/auth/signup` are redirected to `/dashboard`
- Use `@supabase/ssr` `createServerClient` in middleware for cookie-based session

### Middleware Implementation

File: `middleware.ts` — use `@supabase/ssr` `createServerClient`, check session via `supabase.auth.getUser()`, redirect unauthenticated users to `/auth/login`. Protect all routes except `/auth/*`.

---

## UI Requirements

- Both login and sign up pages are centered cards on a clean background
- Show password strength indicator on sign up (weak / medium / strong)
- All form errors shown inline below the relevant field — never as alerts
- Google OAuth button uses the official Google brand colors and logo
- Loading spinner shown on the button while auth call is in progress
- Forms are fully keyboard navigable and accessible
- Fully responsive — works cleanly on mobile

---

## Error States

| Scenario | Message to Show |
|---|---|
| Email already registered | An account with this email already exists. Try logging in. |
| Wrong password | Invalid email or password. |
| Unconfirmed email | Please confirm your email before logging in. |
| Network error | Something went wrong. Please try again. |
| Password too short | Password must be at least 8 characters. |

---

## Sign Out

- Sign out button available in the profile page and optionally in nav dropdown
- Call `supabase.auth.signOut()`
- Redirect to `/auth/login`
- Clear any Zustand stores on sign out
