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

if (import.meta.url === `file://${process.argv[1]}`) {
  callOllama("Say 'ok' and nothing else.")
    .then((r) => console.log(`[${r.provider}] ${r.model} ${r.latencyMs}ms — ${r.text}`))
    .catch((e) => console.error("FAIL:", e.message));
}