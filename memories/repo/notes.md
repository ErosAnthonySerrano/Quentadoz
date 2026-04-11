# Quentadoz Repo Notes

## Next.js 16 Breaking Changes (critical)
- `middleware.ts` is **deprecated** — use `proxy.ts` with a named `proxy` export
- All async request APIs (`cookies`, `headers`, `params`, `searchParams`) are **async-only** — no synchronous access

## Supabase Setup
- `src/lib/supabase/client.ts` — `createBrowserClient` for client components
- `src/lib/supabase/server.ts` — `createServerClient` with cookies for server components
- `proxy.ts` — route protection via `createServerClient` with cookie forwarding

## Design System
- All colors via CSS variables in `globals.css` — NEVER use Tailwind color utilities (e.g. `green-500`)
- Dark mode via `data-theme="dark"` on `<html>`
- Anti-flash script in `layout.tsx` `<head>` reads `localStorage` before hydration
- Spinner keyframe: `@keyframes spin { to { transform: rotate(360deg); } }` in globals.css

## Implementation Status
- [x] SPEC-01: Auth — proxy.ts, /auth/login, /auth/signup, /auth/callback, /auth/confirm, /auth/forgot-password, /auth/reset-password
- [ ] SPEC-02: Dashboard
- [ ] SPEC-03: Budget Form
- [ ] SPEC-04: AI Parser
- [ ] SPEC-05: History
- [ ] SPEC-06: PDF Export
- [ ] SPEC-07: Theme Toggle
- [ ] SPEC-08: Profile

## File Notes
- `proxy.ts` is at the project root (same level as `src/`)
- `src/types/index.ts` — shared TypeScript interfaces
- `src/store/useThemeStore.ts` — Zustand theme store
- `src/components/ui/Button.tsx`, `Input.tsx` — base UI components
