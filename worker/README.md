# AutoQA Worker

Playwright-based worker that runs QA suites and enriches results with AI when configured.

## Setup

```sh
cd worker
npm i
```

## Environment

Worker needs the **same** `LLM_KEY_ENC` as the app — it decrypts API keys from `user_settings` at run start.

Create `worker/.env`:

```env
DATABASE_URL=postgres://user:password@host:5432/autoqa
LLM_KEY_ENC=<same as app .env>
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
NVIDIA_API_KEY=<optional>
NVIDIA_NIM_MODEL=meta/llama-3.1-8b-instruct
OPENROUTER_API_KEY=<optional>
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

## Run

```sh
npm run dev   # watch mode
npm start     # production
```

## AI provider chain

Worker checks providers at startup in order (only adds configured ones):

1. **Ollama** — local, always available but may be unreachable
2. **NVIDIA NIM** — requires `NVIDIA_API_KEY`
3. **OpenRouter** — requires `OPENROUTER_API_KEY`

If all providers fail, worker falls back to deterministic heuristics. AI never blocks a run.
