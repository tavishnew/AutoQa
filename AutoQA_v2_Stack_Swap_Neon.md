# AutoQA v2 — Stack Swap: Supabase → Neon + Drizzle + Better Auth

## New picks — all free-tier

| Piece                  | Was                   | Now                                                                                                                                  | Free tier                                                |
| ---------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| DB                     | Supabase Postgres     | **Neon** (serverless Postgres)                                                                                                       | 1 project, 0.5 GB storage, autosuspend — plenty for MVP  |
| ORM                    | Supabase client / RLS | **Drizzle ORM** — typed schema, `drizzle-kit push` migrations                                                                        | free (just a library)                                    |
| Auth                   | Supabase Auth         | **Better Auth** (self-hosted, works fine with TanStack Start)                                                                        | free (just a library, uses your own DB)                  |
| File storage (reports) | Supabase Storage      | **Cloudflare R2**                                                                                                                    | 10 GB storage + 1M reads/month free, no egress fees ever |
| Worker hosting         | —                     | **Railway free trial / Fly.io free allowance**, or just run it as a scheduled GitHub Action for MVP (no always-on worker needed yet) | free at MVP volume                                       |
| Row-level security     | Supabase RLS          | Enforce ownership checks in your own query layer (`WHERE owner_id = session.user.id`)                                                | —                                                        |

Zero paid services required to get to a working MVP. Why this over Supabase: no reliance on one vendor's auth+db+storage all being up at once, no RLS policies to debug, everything is plain Postgres + typed queries you can inspect and move off later.

## Claude Code should provision Neon itself, via the Neon MCP server

Don't set up the DB by hand in a dashboard — have Claude Code do it through Neon's MCP server so the project, branch, and connection string all get created and wired into env vars in the same session as the schema work.

```
Setup prompt for Claude Code:
"Connect to the Neon MCP server (claude mcp add neon — or check if it's
already available as a connector). Use it to: create a new Neon project
named autoqa-v2, get the pooled connection string, and write it to .env as
DATABASE_URL. Then install Drizzle ORM (postgres-js driver), point it at
DATABASE_URL, and confirm `drizzle-kit push` can reach the DB before
writing any schema."
```

Neon MCP is also useful later for Phase 7 (tests) — it supports instant DB branching, so Claude Code can create a disposable branch per test run through the same MCP tool instead of you managing that by hand.

## Updated phase plan

```
Phase 1 — Wire real auth
"Install better-auth. Set up a Neon Postgres DB, add DATABASE_URL to env.
Configure Better Auth with email+password provider, session stored as an
httpOnly cookie (default behavior — do not switch it to localStorage).
Replace the setTimeout fakes in signin.tsx/signup.tsx with
authClient.signIn.email / authClient.signUp.email. Move dashboard.tsx under
a route guard (TanStack Router beforeLoad checking the Better Auth session)
that redirects unauthenticated visitors to /signin."
```

```
Phase 2 — Data model + projects
"Define Drizzle schema: projects (id, owner_id, name, created_at),
runs (id, project_id, target_url, status, started_at, finished_at,
report_url), test_results (id, run_id, name, status, evidence_url). Run
drizzle-kit generate + push against the DATABASE_URL from Phase 1 (created
via the Neon MCP server). Every query that reads/writes these tables
must filter by owner_id = session.user.id — write this as a small
shared helper, not repeated by hand per query. Replace the sidebar's dead
'Suites' button with a real /dashboard/projects route: list + create
dialog, backed by real Drizzle queries via @tanstack/react-query."
```

```
Phase 3 — Real nav
"Replace the dashboard sidebar's local setActive buttons with real
TanStack Router <Link>s to /dashboard, /dashboard/projects,
/dashboard/runs, /dashboard/settings. Every one of these routes must exist
and render real (even if mostly-empty) content — no item may look
selectable/animated without actually navigating, and none may be
disabled/greyed-out as a placeholder. Keep the existing layoutId pill
animation, just drive it off the router's active route instead of local
state."
```

```
Phase 4 — Runs (wire the actual product)
"Wire 'Run suite' to open a dialog: pick project, paste target URL, submit
inserts a runs row (status=pending) via Drizzle and enqueues a job (stub
the enqueue as TODO for now — unblock UI work first). Replace the
hardcoded runs/stats/coverage arrays in dashboard.tsx with real Drizzle
queries (react-query + a server function/route handler). Wire the 'View
all' button to /dashboard/runs (a real route, real table, real data)."
```

```
Phase 5 — Worker + report
"Set up a small worker (separate process — Railway/Fly, Node or Python)
that picks up pending runs, runs the Playwright crawl+test logic (port
from the old autoqa/discover.py + autoqa/executor.py), writes test_results
rows back to Neon via Drizzle, generates an HTML report, uploads it to
Cloudflare R2 (S3-compatible SDK), sets run status + report_url. Build
/dashboard/runs/[id]/report that fetches and renders it — sanitize with
DOMPurify before dangerouslySetInnerHTML. Add a Download HTML button."
```

```
Phase 6 — Mobile nav (do not skip again)
"Add a mobile nav to dashboard.tsx: hamburger button (visible below lg,
next to the existing lg:hidden logo link) opening a Sheet
(components/ui/sheet.tsx already in the project) with the same nav items
as the desktop sidebar. Verify the dashboard is fully usable and navigable
at 375px width before calling this done."
```

```
Phase 7 — Tests
"Add Playwright e2e tests that sign up, log in, create a project, start a
run, and check it appears — through the real UI, not hand-guessed API
payloads. Use the Neon MCP server to create a disposable branch per test
run (instant DB branching) and discard it after — never a shared
persistent DB for tests."
```

## Everything else from the previous cross-check still stands

Dead "Run suite" / "View all" buttons, fake sidebar nav, missing mobile nav, unprotected `/dashboard` — same fixes, same order, just Neon/Drizzle/Better Auth in place of Supabase wherever it says "wire the backend."
