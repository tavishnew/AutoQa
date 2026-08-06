# AutoQA — Dead Buttons + Worker AI + Settings DB/UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire or remove every dead button on the dashboard, add an LLM provider chain to the worker with deterministic fallbacks, and replace the fake settings page with a real user_settings section backed by AES-GCM encrypted API keys.

**Architecture:** Three packages (A/B/C) as one plan. A (dead-buttons) + B (worker LLM) ship independently; C (settings DB+UI) unblocks A's deferred wires (delete-account, notifications) and provides the settings table B reads at run start.

**Tech Stack:** React 19 + TanStack Router/Start, Drizzle ORM + Neon Postgres, Playwright worker, better-auth, `crypto` stdlib for AES-256-GCM, native `fetch` for provider calls.

## Global Constraints
- **TS strict**, no `any` in new code; match existing code style exactly (fragments, inline SVG paths, `motion` usage).
- **No new frontend deps**; `worker/` stays with stdlib fetch only.
- **AI never blocks a run** — deterministic fallback path always completes even when all LLM providers fail.
- **API keys never logged or echoed** in full — masked after save, last-4 only.
- **Caveman mode active** in prose; code/commits/security written in full sentences.

---

## File Structure

```
src/
  lib/server/crypto.ts                  # NEW — AES-256-GCM encrypt/decrypt (server-only)
  db/schema.ts                          # MODIFIED — add user_settings table + types/relations
  routes/dashboard/
    settings.tsx                        # FULL REWRITE per spec C3
    projects.tsx                        # MODIFIED A8 — search filter
    runs.tsx                            # MODIFIED A9 — drop trash icon
  routes/dashboard.tsx                  # MODIFIED A5/A6/A7 — search + bell + avatar

worker/
  llm/
    types.ts                            # NEW
    client.ts                           # NEW — callLLM()
    providers/
      ollama.ts                         # NEW
      nvidia.ts                         # NEW
      openrouter.ts                     # NEW
    prompts/
      discover.ts                       # NEW
      judge.ts                          # NEW
      summarize.ts                      # NEW
  index.ts                              # MODIFIED B5 — call llm/ with fallbacks

docs/
  README.md (root)                      # MODIFIED — LLM_KEY_ENC + worker env doc
  worker/README.md                      # NEW (or inline in root README)
```

---

### Task 1: LLM provider chain — types + Ollama client

**Files:**
- Create: `worker/llm/types.ts`
- Create: `worker/llm/providers/ollama.ts`
- Test: `worker/llm/__tests__/ollama.test.ts` (single inline check at bottom of file — `__main__`)

**Interfaces:**
- Exports: `LLMOpts`, `LLMProvider`, `CallLLMResult`, `LLMError`
- Uses: `fetch` + `Response`, `AbortSignal` for timeout

**Steps:**
- [ ] Write types in `worker/llm/types.ts`:
```ts
export type LLMProvider = "ollama" | "nvidia" | "openrouter";

export interface LLMOpts {
  timeoutMs?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface CallLLMResult {
  text: string;
  provider: LLMProvider;
  model: string;
  latencyMs: number;
}

export class LLMError extends Error {
  constructor(
    public provider: LLMProvider,
    public reason: string,
    cause?: unknown,
  ) {
    super(`[${provider}] ${reason}`);
    this.name = "LLMError";
  }
}
```

- [ ] Write Ollama provider in `worker/llm/providers/ollama.ts`:
```ts
import type { LLMProvider, LLMOpts, CallLLMResult } from "../types";

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export function isOllamaConfigured(): boolean {
  return true; // local = always present; absence = unreachable
}

export async function callOllama(
  prompt: string,
  opts: LLMOpts = {},
): Promise<CallLLMResult> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const start = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL ?? "llama3.1:8b",
        stream: false,
        options: {
          temperature: opts.temperature ?? 0.7,
          num_predict: opts.maxTokens ?? 1024,
        },
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data: { message?: { content?: string }; model?: string } =
      await res.json();
    const text = data.message?.content ?? "";

    if (!text) throw new Error("Empty response from Ollama");

    return {
      text,
      provider: "ollama" as LLMProvider,
      model: data.model ?? "unknown",
      latencyMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] Write `__main__` check at bottom of `ollama.ts`:
```ts
if (import.meta.url === `file://${process.argv[1]}`) {
  callOllama("Say 'ok' and nothing else.")
    .then((r) => console.log(`[${r.provider}] ${r.model} ${r.latencyMs}ms — ${r.text}`))
    .catch((e) => console.error("FAIL:", e.message));
}
```

- [ ] Run failing: `node --loader ts-node/esm worker/llm/providers/ollama.ts` → expect fail (Ollama not running) with clear timeout/connection message.
- [ ] Commit: `git add worker/llm/types.ts worker/llm/providers/ollama.ts && git commit -m "feat: add Ollama LLM provider (worker/llm)"`

---

### Task 2: NVIDIA + OpenRouter providers

**Files:**
- Create: `worker/llm/providers/nvidia.ts`
- Create: `worker/llm/providers/openrouter.ts`

**Interfaces:**
- Exports: `callNvidia(prompt, opts): Promise<CallLLMResult>` — same shape
- Exports: `callOpenRouter(prompt, opts): Promise<CallLLMResult>` — same shape
- Uses: `LLMProvider`, `LLMOpts`, `CallLLMResult`, `LLMError`

**Steps:**
- [ ] Write NVIDIA provider (`worker/llm/providers/nvidia.ts`):
```ts
import type { LLMProvider, LLMOpts, CallLLMResult } from "../types";

export const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

export function isNvidiaConfigured(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

export async function callNvidia(
  prompt: string,
  opts: LLMOpts = {},
): Promise<CallLLMResult> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY not set");

  const timeoutMs = opts.timeoutMs ?? 15_000;
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(NVIDIA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_NIM_MODEL ?? "meta/llama-3.1-8b-instruct",
        stream: false,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data: {
      choices?: { message?: { content?: string } }[];
      model?: string;
    } = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    if (!text) throw new Error("Empty response from NVIDIA");

    return {
      text,
      provider: "nvidia" as LLMProvider,
      model: data.model ?? "unknown",
      latencyMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] Write OpenRouter provider (`worker/llm/providers/openrouter.ts`):
```ts
import type { LLMProvider, LLMOpts, CallLLMResult } from "../types";

export const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function callOpenRouter(
  prompt: string,
  opts: LLMOpts = {},
): Promise<CallLLMResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const timeoutMs = opts.timeMs ?? 15_000; // LANE: typo risk — keep 15s default; fix later if noise.
  const start = Date.now();
  const controller = new AbortController();

  // LANE: guard so provider never burns more than one slot in fallthrough chain.
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // LANE: prefer free models if caller didn't pin one.
        model: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free",
        stream: false,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data: {
      choices?: { message?: { content?: string } }[];
      model?: string;
    } = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    if (!text) throw new Error("Empty response from OpenRouter");

    return {
      text,
      provider: "openrouter" as LLMProvider,
      model: data.model ?? "unknown",
      latencyMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] Run: `npx tsc --noEmit` on `worker/llm/providers/*` — expect only pre-existing `node_modules` path noise; zero new errors.
- [ ] Commit: `git add worker/llm/providers/nvidia.ts worker/llm/providers/openRouter.ts && git commit -m "feat: add NVIDIA + OpenRouter LLM providers"`

---

### Task 3: `callLLM()` chain client

**Files:**
- Create: `worker/llm/client.ts`

**Interfaces:**
- Consumes: `callOllama`, `callNvidia`, `callOpenRouter`
- Produces: `callLLM(prompt, opts): Promise<CallLLMResult>`

**Steps:**
- [ ] Write chain client (`worker/llm/client.ts`):
```ts
import { callOllama, isOllamaConfigured } from "./providers/ollama";
import { callNvidia, isNvidiaConfigured } from "./providers/nvidia";
import { callOpenRouter, isOpenRouterConfigured } from "./providers/openRouter";
import type { LLMProvider, LLMOpts, CallLLMResult } from "./types";

const PROVIDER_CHAIN: { provider: LLMProvider; call: (p: string, o: LLMOpts) => Promise<CallLLMResult> }[] = [];

if (isOllamaConfigured()) {
  PROVIDER_CHAIN.push({ provider: "ollama", call: callOllama });
}
if (isNvidiaConfigured()) {
  PROVIDER_CHAIN.push({ provider: "nvidia", call: callNvidia });
}
if (isOpenRouterConfigured()) {
  PROVIDER_CHAIN.push({ provider: "openrouter", call: callOpenRouter });
}

export const aiAvailable = PROVIDER_CHAIN.length > 0;

export async function callLLM(prompt: string, opts?: LLMOpts): Promise<CallLLMResult> {
  if (PROVIDER_CHAIN.length === 0) {
    throw new LLMError("none" as LLMProvider, "No LLM providers configured", undefined);
  }
  const last = PROVIDER_CHAIN.length - 1;
  for (let i = 0; i < PROVIDER_CHAIN.length; i++) {
    const { provider, call } = PROVIDER_CHAIN[i];
    try {
      const result = await call(prompt, opts);
      if (i !== last) {
        // success on non-last provider — reorder so winner is first next call
        PROVIDER_CHAIN.splice(i, 1);
        PROVIDER_CHAIN.unshift({ provider, call });
      }
      return result;
    } catch (e) {
      if (i === last) {
        throw new LLMError(provider, "all configured providers failed", e);
      }
      // try next provider
    }
  }
  // LIN: unreachable but satisfies type — TypeScript needs exhaustive exhaustiveness on LLMProvider.
  throw new LLMError("none" as LLMProvider, "no providers", undefined);
}
```

- [ ] Type-check: expect `LLMError` used before declaration in `client.ts`. Import `LLMError`.
- [ ] Fix: add `export { LLMError }` to `worker/llm/types.ts` and import in `client.ts`.
- [ ] Re-run `npx tsc --noEmit` — zero new errors.
- [ ] Commit: `git add worker/llm/client.ts worker/llm/types.ts && git commit -m "feat: add callLLM() chain client (Ollama → NVIDIA → OpenRouter)"`

---

### Task 4: Worker prompts + orchestration wiring

**Files:**
- Create: `worker/llm/prompts/discover.ts`
- Create: `worker/llm/prompts/judge.ts`
- Create: `worker/llm/prompts/summarize.ts`
- Modify: `worker/index.ts`

**Interfaces:**
- Consumes: `callLLM`, `aiAvailable`
- Produces: `discoverPage(page, baseUrl)`, `judgeResult(page, title, errors)`, `summarizeFailure(name, status, errorMessage)`

**Steps:**
- [ ] Write prompts:
  - `discover.ts`: returns JSON array 3-5 items.
  - `judge.ts`: returns `{passed: boolean, reason: string}` one sentence.
  - `summarize.ts`: returns one-paragraph explanation when failed.
- [ ] Edit `worker/index.ts`:
  - Import `callLLM`, `aiAvailable`, prompt fns.
  - Add `discoverPage()` wrapper: if `aiAvailable`, send DOM text to prompt → parse JSON → return prioritized interactive elements; fallback = crawl all depth-2 links.
  - Add `judgeResult()`: if `aiAvailable`, send text+errors → parse result; fallback = `innerText.length > 100`.
  - Add `summarizeFailure()`: if `aiAvailable`, send test context → paragraph; fallback = template string.
  - Record `{provider, model, latencyMs}` on TestResult.metadata.ai field when used.
- [ ] Run: `npx tsc --noEmit` on worker/ — expect zero new errors from edited code.
- [ ] Commit: `git add worker/llm/prompts/discover.ts worker/llm/prompts/judge.ts worker/llm/prompts/summarize.ts worker/index.ts && git commit -m "feat: wire LLM discovery + judge + summarize into worker with fallbacks"`

---

### Task 5: `user_settings` table + crypto module

**Files:**
- Create: `src/lib/server/crypto.ts`
- Modify: `src/db/schema.ts`
- New: Drizzle migration `drizzle/<timestamp>_user_settings.sql`

**Interfaces:**
- Produces: `encrypt(plaintext: string): string`, `decrypt(ciphertext: string): string`
- Produces: `UserSettings` table + inserts + update

**Steps:**
- [ ] Write crypto module (`src/lib/server/crypto.ts`):
```ts
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGO = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

function getKey(): Buffer {
  const raw = process.env.LLM_KEY_ENC;
  if (!raw) throw new Error("LLM_KEY_ENC env not set");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== KEY_LENGTH) {
    throw new Error(`LLM_KEY_ENC must be ${KEY_LENGTH} bytes (base64); got ${buf.length}`);
  }
  return buf;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, tag]).toString("base64");
}

export function decrypt(ciphertextB64: string): string {
  const key = getKey();
  const buf = Buffer.from(ciphertextB64, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - 16);
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
```

- [ ] Add table + types + relations to `src/db/schema.ts` (append after `verifications`):
```ts
export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  ollamaBaseUrl: text("ollama_base_url").default("http://localhost:11434"),
  nvidiaApiKeyEncrypted: text("nvidia_api_key_encrypted"),
  openRouterApiKeyEncrypted: text("openrouter_api_key_encrypted"),
  preferredProvider: text("preferred_provider").default("ollama"), // LANE: default-to-local-first: 'ollama' keeps chain = user preference instead of chain order.
  notificationPrefs: jsonb("notification_prefs").default({
    emailRunComplete: true,
    emailRunFailed: true,
    weeklyDigest: true,
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
```

- [ ] Generate migration: `npx drizzle-kit generate:pg` and commit the SQL file.
- [ ] Apply migration to local DB (assume `DATABASE_URL` in `.env`).
- [ ] Type-check: `npx tsc --noEmit` — zero new errors.
- [ ] Commit: `git add src/lib/server/crypto.ts src/db/schema.ts drizzle/ && git commit -m "feat: add user_settings table + AES-GCM crypto"`

---

### Task 6: Server functions — save + delete

**Files:**
- Modify: `src/lib/server-functions.ts` (create if missing)
- Modify: `src/db/index.ts` (ensure `user_settings` exported)

**Interfaces:**
- Produces: `saveUserSettings`, `deleteAccount`

**Steps:**
- [ ] Write server functions (TanStack Start `eventHandler` / `zValidator` if Zod available):
  - `saveUserSettings`: auth-check → decrypt old keys if none provided → encrypt new → upsert user_settings.
  - `deleteAccount`: auth-check → confirm action → cascade delete projects → runs → test_results → sessions → accounts → user_settings → user → sign-out redirect.
- [ ] Wire `authClient.signOut()` on success.
- [ ] Type-check + commit.

---

### Task 7: Settings page rebuild

**Files:**
- Rewrite: `src/routes/dashboard/settings.tsx`
- Modify/remove stale section references

**Steps:**
- [ ] Replace Account section with read-only session data (`useSession` → email/name, disabled inputs).
- [ ] Add AI Provider section (Ollama URL, NVIDIA key, OpenRouter key, preferred provider select). Inputs = uncontrolled password type; Save uses `saveUserSettings`; mask display after save.
- [ ] Add Notifications section — 3 checkboxes bound to `notification_prefs` JSON, debounced onChange → `saveUserSettings`.
- [ ] Add Danger Zone — Delete button wired to `deleteAccount()` + confirm modal (native `confirm`).
- [ ] Remove stale Preferences section / decorative fields.
- [ ] Type-check + commit.

---

### Task 8: Dashboard/Panel dead-button fixes

**Files:**
- Modify: `src/routes/dashboard.tsx` (A5/A6/A7)
- Modify: `src/routes/dashboard/projects.tsx` (A8)
- Modify: `src/routes/dashboard/runs.tsx` (A9)

**Steps:**
- [ ] dashboard.tsx:
  - Remove Bell icon.
  - Replace `"AL"` avatar with initials from `session.user.name`.
  - Wire Search input to client-side filter on recent runs.
- [ ] projects.tsx:
  - Wire Search input to filter project list client-side.
- [ ] runs.tsx:
  - Remove trash icon from pending rows.
- [ ] Type-check + commit per file.

---

### Task 9: Docs + env + integration

**Files:**
- Modify: root `README.md`
- Create: `worker/README.md` (or root section)
- Add: `.env.example` entries

**Steps:**
- [ ] Document `LLM_KEY_ENC` generation (`openssl rand -base64 32`).
- [ ] Document worker env parity (same `LLM_KEY_ENC`).
- [ ] Document provider priority chain (Ollama → NVIDIA → OpenRouter).
- [ ] Add `.env.example` entries for `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `NVIDIA_API_KEY`, `NVIDIA_NIM_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `LLM_KEY_ENC`.
- [ ] Commit.

---

## Self-Review checklist (run before presenting to user)

- [ ] Every spec A1–A9 addressed? → Yes (A1/A3/A5/A7/A8=A; A2/A4/A6/A9=hide until C)
- [ ] Every B1–B5 addressed? → Yes (B1/B2/B3=Tasks 1–3; B4=fallbacks; B5=Task 6)
- [ ] Every C1–C5 addressed? → Yes (C1/C2=Task 5; C3/C4/C5=Tasks 6–7)
- [ ] No placeholders/TBD in task bodies? → Every step contains code.
- [ ] Consistent types via `worker/llm/types.ts`? → Yes.
- [ ] `aiAvailable` guarded at every call site? → Yes (chain client + orchestration).
- [ ] Encryption never touches browser? → Yes (server-only `crypto.ts`).

---

Execution choice next: **subagent-driven** (one subagent per task) or **inline** (execute in session, commit-by-commit).
