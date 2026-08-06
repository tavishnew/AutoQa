# AutoQA — Dead Buttons + Worker AI + Settings DB/UI

**Spec**: `2026-08-06-dead-buttons-ai-settings-design.md`
**Status**: Draft
**Scope**: 3 packages (A: UI dead-button wiring, B: worker LLM layer, C: settings DB + UI)

---

## Package A — Dead Button Fixes (UI only)

### What ships
Mechanical wiring of existing UI controls to real data; no server mutations added. Everything that needs a save/write is **removed or hidden** until Package C delivers the mutation layer.

| Issue | Fix | Rationale |
|-------|-----|-----------|
| A1: Email/Name hardcoded + disabled | Show `session.user.email` / `session.user.name` from `useSession()`, keep `disabled` | Edit mutation deferred to C |
| A2: Notification checkboxes no `onChange` | **Remove entire Preferences section** from settings page | Fake-functional control worse than none; C rebuilds it |
| A3: "312/500" hardcoded | Replace with `getDashboardStats` (existing). Use `stats.runCount` / derived monthly count | Zero new backend |
| A4: Delete account button no-op | **Remove button & Danger zone section** | C adds cascade-delete mutation |
| A5: Overview search decorative | Client-side `useState` filter on recent-runs list rows | One-liner, no server |
| A6: Bell icon ×3, no dropdown | **Remove Bell icon** from all three headers (dashboard, runs, settings) | Honest UI > fake toast target |
| A7: "AL" avatar literal | Derive initials from `session.user.name`/`email` | Matches existing patterns elsewhere |
| A8: projects.tsx search decorative | Same client-side filter as A5 | Consistent |
| A9: runs.tsx trash icon disabled | **Remove icon** from pending rows | C adds cancel mutation |

**Behavioral invariant**: every control visible on `/dashboard/*` either (a) reads real state or (b) is gone. No disabled-but-visible affordances remain.

---

## Package B — Worker AI Layer

### B1 — Directory structure
```
worker/
  llm/
    types.ts          # CallLLMResult, LLMProvider, LLMOpts
    client.ts         # callLLM() — exports single async fn
    providers/
      ollama.ts
      nvidia.ts
      openrouter.ts
    prompts/
      discover.ts     # page → [{description, selector_hint}]
      judge.ts        # page+errors → {passed, reason}
      summarize.ts    # failure → human paragraph
  index.ts            # orchestration unchanged, calls into llm/
```

### B2 — `callLLM(prompt, opts)` contract
```ts
type LLMOpts = { timeoutMs?: number; temperature?: number; maxTokens?: number };
type CallLLMResult = { text: string; provider: LLMProvider; model: string; latencyMs: number };

async function callLLM(prompt: string, opts?: LLMOpts): Promise<CallLLMResult>
```

**Chain behavior** (sequential fallthrough):
1. Startup: build `configuredProviders = []`
   - if `OLLAMA_BASE_URL` (default `http://localhost:11434`) → `['ollama']`
   - if `NVIDIA_API_KEY` → `['nvidia']`
   - if `OPENROUTER_API_KEY` → `['openrouter']`
2. Per-call: iterate `configuredProviders` in order; first 2xx wins; record provider+model on result.
3. If `configuredProviders.length === 0` → `callLLM` throws `ERR_NO_PROVIDER` (sentinel). Callers catch → deterministic fallback.
4. If all configured providers fail → throw `ERR_ALL_PROVIDERS_FAILED`. Callers catch → deterministic fallback.
5. Per-call timeout default **15s** (configurable). Timeout counts as provider failure, continues chain.

### B3 — Provider implementations

| Provider | Endpoint | Auth | Health check | Free tier notes |
|----------|----------|------|--------------|-----------------|
| **Ollama** | `POST ${OLLAMA_BASE_URL}/api/chat` | none | `GET /api/tags` | Local, no key. Requires user-run Ollama. |
| **NVIDIA NIM** | `POST https://integrate.api.nvidia.com/v1/chat/completions` | Bearer `NVIDIA_API_KEY` | `GET /v1/models` | 1000 req/mo free. OpenAI-compatible. |
| **OpenRouter** | `POST https://openrouter.ai/api/v1/chat/completions` | Bearer `OPENROUTER_API_KEY` | `GET /api/v1/models` | Free models tagged `:free` (e.g. `meta-llama/llama-3.1-8b-instruct:free`). |

All three speak OpenAI-compatible chat-completion schema (`{messages, model, temperature, max_tokens}`). `ollama.ts` maps to native `/api/chat` shape.

### B4 — Deterministic fallbacks (when `aiAvailable === false` or chain exhausted)

| Step | Current heuristic | Fallback behavior |
|------|-------------------|-------------------|
| Discover | crawl all `<a href>` depth 2 | **unchanged** — fast pre-pass always runs |
| Judge pass/fail | `innerText.length > 100` | **unchanged** — instant |
| Summarize | `"HTTP 500" / "timeout" / template` | Template string: `"Test ${name} ${status}: ${errorMessage || 'no error detail'}. Consider re-running."` |

**Design principle**: the worker **never blocks** on AI. AI enriches; deterministic path always completes.

### B5 — Threading user settings into worker
Query at run start:
```sql
SELECT u.id, u.email, us.ollama_base_url, us.nvidia_api_key_encrypted,
       us.openrouter_api_key_encrypted, us.preferred_provider
FROM runs r
JOIN projects p ON r.project_id = p.id
JOIN users u ON p.owner_id = u.id
LEFT JOIN user_settings us ON us.user_id = u.id
WHERE r.id = $1
```
Worker decrypts keys in-memory (never logged). Keys only live for the duration of `processRun()`.

---

## Package C — Settings DB + UI

### C1 — `user_settings` table
```sql
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ollama_base_url text DEFAULT 'http://localhost:11434',
  nvidia_api_key_encrypted text,       -- AES-GCM base64
  openrouter_api_key_encrypted text,   -- AES-GCM base64
  preferred_provider text CHECK (preferred_provider IN ('ollama','nvidia','openrouter')),
  notification_prefs jsonb DEFAULT '{"emailRunComplete":true,"emailRunFailed":true,"weeklyDigest":true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
Index: implicit unique on `user_id`.

### C2 — Encryption (server-only, AES-256-GCM)
- New env `LLM_KEY_ENC` = 32-byte base64 (`openssl rand -base64 32`).
- Module `src/lib/server/crypto.ts`:
  - `encrypt(plaintext: string): string` → base64 `iv:ciphertext:tag`
  - `decrypt(ciphertext: string): string` → plaintext or throws
- Worker imports **same module** (shared code, not client). Same `LLM_KEY_ENC` in worker env.

### C3 — Settings page rebuild (`/dashboard/settings`)

**Sections (top → bottom):**

1. **Account (read-only)**
   - Email: `session.user.email` (disabled input)
   - Name: `session.user.name` (disabled input)
   - *No Save button here.*

2. **AI Provider** (new, replaces old Preferences)
   - Ollama base URL (text, default `http://localhost:11434`)
   - NVIDIA API Key (password, masked after save → `••••abcd`)
   - OpenRouter API Key (password, masked after save)
   - Preferred provider (select, populated from configuredProviders)
   - **Test Connection** button:
     - Fires 3 parallel health checks (one per non-empty provider)
     - Shows per-provider chip: ✓ OK / ✗ Failed with hover tooltip
     - Does **not** save.
   - **Save** button → server function `saveUserSettings(input)`:
     - Encrypts any provided keys.
     - Upserts `user_settings` row.
     - Returns masked preview for display; never echoes full key.

3. **Notifications**
   - Three checkboxes bound to `notification_prefs` JSON columns.
   - `onChange` debounced (300ms) → same `saveUserSettings` mutation.

4. **Danger Zone**
   - **Delete Account** button → server function `deleteAccount()`:
     - Confirm modal (native `confirm` + typed "DELETE").
     - Cascades: projects → runs → test_results → sessions → accounts → user.
     - Calls `authClient.signOut()`, redirects `/`.

### C4 — Server functions (TanStack Start)
- `saveUserSettings(input: SettingsInput)` — auth-checked, user-scoped.
- `deleteAccount()` — auth-checked, user-scoped, wraps in transaction.

### C5 — Worker env sync
Worker process must have identical `LLM_KEY_ENC` value. Document in `worker/README.md` and root `README.md`.

---

## Cross-package interactions

| From | To | Contract |
|------|----|----------|
| C (schema) | B (worker) | `user_settings` row per user, decrypted at run start |
| C (UI) | B (worker) | Test Connection validates same endpoints worker uses |
| A (hides) | C (ships) | Controls removed in A reappear when C adds mutations |

---

## Acceptance criteria

### Package A
- [ ] `npm run lint` clean.
- [ ] No `disabled` inputs/buttons visible on `/dashboard/*`.
- [ ] Bell icons absent.
- [ ] "Free plan" numbers match `getDashboardStats` or `/dashboard/runs` count for current user.
- [ ] Avatar initials = first letters of `session.user.name` / `session.user.email`.
- [ ] Search inputs on dashboard + projects filter their respective lists client-side.

### Package B
- [ ] `callLLM()` unit-testable with mocked fetch; deterministic fallback path exercised.
- [ ] Worker startup logs: `AI providers configured: ollama, nvidia` (or subset).
- [ ] Run with 0 providers configured completes successfully using deterministic heuristics.
- [ ] Run with 1 provider failing + 1 succeeding records the winning provider on `test_results.metadata`.
- [ ] Discovery prompt returns valid JSON `[{description, selector_hint}]` for a real page; judge prompt returns `{passed: boolean, reason: string}`.

### Package C
- [ ] Migration applies cleanly to local Neon dev DB.
- [ ] Settings page: Account shows real session data; AI Provider section present + Test Connection works for at least one configured provider; Save persists + masked display correct; Delete Account cascades + signs out.
- [ ] Notification prefs saved + loaded.
- [ ] Worker reads `user_settings` on run start; decrypts keys without logging.

---

## Out of scope (explicitly not in this spec)
- Edit-profile mutation (separate from C's read-only Account).
- Real notification system (table, polling, dropdown) — now that Bell is removed, this lives in a future package.
- LLM prompt versioning / A/B testing infrastructure.
- Run cancellation (covers A9 but needs worker-side status check + DB mutation).
- Multi-user project sharing / teams.

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| `LLM_KEY_ENC` rotation breaks existing encrypted keys | Add `key_version` column later; for now, document that rotation = re-enter keys. |
| Worker decryption error crashes run | `try/catch` around decrypt; on failure treat as `ERR_DECRYPT` → skip provider, continue chain. |
| NVIDIA/OpenRouter free tier quota exhausted mid-run | Chain falls through; deterministic fallback completes run. Log quota error for user. |
| Settings page Save race (double-click) | Server function idempotent on `user_id` upsert; client disables button during mutation. |
| Schema migration on prod Neon | Generate via `drizzle-kit generate`, review, apply via CI. Separate from code deploy. |

---

## File list (new/changed)

**New**
- `worker/llm/types.ts`
- `worker/llm/client.ts`
- `worker/llm/providers/ollama.ts`
- `worker/llm/providers/nvidia.ts`
- `worker/llm/providers/openrouter.ts`
- `worker/llm/prompts/discover.ts`
- `worker/llm/prompts/judge.ts`
- `worker/llm/prompts/summarize.ts`
- `src/db/schema.ts` → add `user_settings` table + export
- `src/lib/server/crypto.ts`
- `src/lib/server-functions.ts` → add `saveUserSettings`, `deleteAccount`
- Migration file `drizzle/..._user_settings.sql`

**Changed**
- `worker/index.ts` → import `callLLM`, add discovery/judge/summarize with fallbacks
- `worker/package.json` → no new deps (all stdlib/fetch)
- `src/routes/dashboard/settings.tsx` → full rebuild per C3
- `src/routes/dashboard.tsx` → remove Bell, fix avatar, add search filter
- `src/routes/dashboard/runs.tsx` → remove trash icon, add search filter (if any)
- `src/routes/dashboard/projects.tsx` → add search filter
- `src/db/index.ts` → export `user_settings` + relations

**Docs**
- `README.md` → document `LLM_KEY_ENC` generation, worker env parity
- `worker/README.md` → same

---

## Next step

This spec is ready for **self-review** (placeholder/ambiguity/consistency scan). Once clean, I'll ask you to review the written file before invoking `writing-plans`.