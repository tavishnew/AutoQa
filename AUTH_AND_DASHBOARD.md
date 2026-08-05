# AutoQA — Auth & Dashboard UI

This document describes the sign-in, sign-up and dashboard screens added to the
AutoQA marketing/product site, the problems they fix, and how to extend them
with a real backend.

## Routes

| Route        | File                       | Purpose                                       |
| ------------ | -------------------------- | --------------------------------------------- |
| `/signin`    | `src/routes/signin.tsx`    | Returning-user sign in                        |
| `/signup`    | `src/routes/signup.tsx`    | Account creation with password strength meter |
| `/dashboard` | `src/routes/dashboard.tsx` | Signed-in overview: runs, coverage, trends    |

Shared chrome for the auth screens lives in
`src/components/site/auth-layout.tsx` (`AuthLayout`, `SocialButtons`).

## What was wrong before

1. **No auth screens at all** — the header's "Sign in" and "Get started"
   buttons both pointed at `/contact`, a dead end for anyone trying to log in.
2. **Empty-feeling auth pages** — a bare centred form on an empty page gives no
   context, no trust signals and no sense of product value.
3. **No signed-in surface** — nothing showed what the product actually does
   after login.

## What the new screens do

### Auth layout (split screen)

- **Left brand panel** (desktop only): spotlight grid background, product
  promise, three staggered value bullets, and a live-looking CLI output card.
  This fills the "too empty" space with useful, on-brand content instead of
  padding.
- **Right form panel**: logo fallback for mobile, clear title/subtitle,
  social buttons, an `or email` divider, then the form.
- Fully responsive: the brand panel collapses below `lg`, the form stays
  centred and comfortable at 360px width.

### Sign in

- Email + password with a show/hide toggle (`Eye` / `EyeOff`).
- "Keep me signed in" checkbox and a "Forgot?" affordance next to the label.
- Inline validation: invalid email or a password under 6 characters animates an
  `role="alert"` message rather than silently failing.
- Submit button has an explicit loading state (`Loader2` spinner).
- CLI hint at the bottom for terminal-first users.

### Sign up

- Name, email, password, and a terms checkbox.
- **Password strength meter**: an animated bar plus three live rules
  (8+ chars, one number, one uppercase) that light up as they're satisfied.
- **Success state**: the form cross-fades into a "Check your inbox"
  confirmation with a spring-animated check mark and a link into the dashboard.

### Dashboard

- **Sidebar**: five sections with a shared `layoutId` pill that slides between
  items, plus a plan-usage card with a progress bar and upgrade CTA.
- **Top bar**: search input, notifications, primary "Run suite" action, avatar.
- **Stat cards**: four KPIs using cursor-tracking `GlowCard` and `CountUp`
  numbers that animate on view.
- **Recent runs**: status pills (passed / failed / flaky), each row expandable
  into an animated panel with the agent's root-cause explanation and a
  suggested fix — the core AutoQA value made visible.
- **Pass rate trend**: bar chart whose columns grow in on scroll.
- **Coverage by surface**: animated progress bars per surface area.

## Motion & accessibility notes

- All animation uses `motion/react` primitives already in the project
  (`Reveal`, `Stagger`, `StaggerItem`, `GlowCard`, `CountUp`), which respect
  `prefers-reduced-motion`.
- Interactive elements keep `focus-visible` rings; icon-only buttons carry
  `aria-label`s; error and success regions use `role="alert"` / `role="status"`.
- Colour comes only from semantic tokens (`foreground`, `muted-foreground`,
  `card`, `border`, `destructive`) so both themes stay correct.

## Current state: UI only

The forms are **presentational**. Submitting simulates a request with a
`setTimeout` and the dashboard renders static demo data. Nothing is persisted
and `/dashboard` is not protected.

## Wiring up real auth

1. Enable the backend (Lovable Cloud / Supabase) so
   `src/integrations/supabase/client` exists.
2. Replace the `onSubmit` handlers:
   - sign in → `supabase.auth.signInWithPassword({ email, password })`
   - sign up → `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })`
   - social → `supabase.auth.signInWithOAuth({ provider: "github" | "google" })`
3. Move `dashboard.tsx` under a protected layout
   (`src/routes/_authenticated/dashboard.tsx`) so unauthenticated visitors are
   redirected to `/signin`.
4. Make the header session-aware: swap "Sign in / Get started" for an account
   menu with sign-out once a session exists.
5. Replace the demo arrays (`stats`, `runs`, `coverage`, `trend`) with a route
   loader using `queryClient.ensureQueryData` + `useSuspenseQuery`.

## File map

```text
src/
  components/site/auth-layout.tsx   # split-screen auth shell + social buttons
  routes/signin.tsx                 # /signin
  routes/signup.tsx                 # /signup
  routes/dashboard.tsx              # /dashboard
```
