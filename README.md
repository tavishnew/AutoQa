# AutoQA

Automated QA test runner with AI-powered page discovery and failure analysis.

## Quick start

```sh
npm i
npm run dev
```

## Environment variables

App (`.env`):

- `DATABASE_URL` — Neon Postgres connection string
- `BETTER_AUTH_URL` — auth server base URL (default `/api/auth`)
- `LLM_KEY_ENC` — base64 32-byte key for AES-256-GCM API key encryption (see below)

Worker (`worker/.env` — same values as app):

- `DATABASE_URL` — same Postgres DB
- `LLM_KEY_ENC` — identical key (worker decrypts API keys at run start)
- `OLLAMA_BASE_URL` — default `http://localhost:11434`
- `OLLAMA_MODEL` — default `llama3.1:8b`
- `NVIDIA_API_KEY` — optional, for NVIDIA NIM provider
- `NVIDIA_NIM_MODEL` — default `meta/llama-3.1-8b-instruct`
- `OPENROUTER_API_KEY` — optional, for OpenRouter provider
- `OPENROUTER_MODEL` — default `meta-llama/llama-3.1-8b-instruct:free`

### Generate `LLM_KEY_ENC`

```sh
openssl rand -base64 32
```

Set the **same value** in both app `.env` and `worker/.env`. Keys are encrypted/decrypted server-side only; never sent to browser.

## AI provider chain

Worker tries providers in order at startup (only configured ones):

1. **Ollama** — local, always present but may be unreachable if not running
2. **NVIDIA NIM** — requires `NVIDIA_API_KEY`, 1000 req/mo free
3. **OpenRouter** — requires `OPENROUTER_API_KEY`, free models available

If all providers fail, worker falls back to deterministic heuristics (no AI). AI never blocks a run.

## Worker

```sh
cd worker
npm i
npm run dev   # or: npm start
```

Worker reads `user_settings` on run start, decrypts API keys in-memory, and discards them when the run finishes.

## Built with

- TanStack Start + React 19
- Drizzle ORM + Neon Postgres
- better-auth
- Playwright
- AES-256-GCM via Node `crypto`
