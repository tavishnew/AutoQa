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

  const timeoutMs = opts.timeoutMs ?? 15_000;
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
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