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