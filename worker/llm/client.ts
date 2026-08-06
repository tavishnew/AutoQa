import { callOllama, isOllamaConfigured } from "./providers/ollama.ts";
import { callNvidia, isNvidiaConfigured } from "./providers/nvidia.ts";
import { callOpenRouter, isOpenRouterConfigured } from "./providers/openrouter.ts";
import type { LLMProvider, LLMOpts, CallLLMResult } from "./types.ts";
import { LLMError } from "./types.ts";

const PROVIDER_CHAIN: { readonly provider: LLMProvider; readonly call: (p: string, o: LLMOpts) => Promise<CallLLMResult> }[] = [];

if (isOllamaConfigured()) PROVIDER_CHAIN.push({ provider: "ollama", call: callOllama });
if (isNvidiaConfigured()) PROVIDER_CHAIN.push({ provider: "nvidia", call: callNvidia });
if (isOpenRouterConfigured()) PROVIDER_CHAIN.push({ provider: "openrouter", call: callOpenRouter });

export const aiAvailable = PROVIDER_CHAIN.length > 0;

export async function callLLM(prompt: string, opts: LLMOpts = {}): Promise<CallLLMResult> {
  if (PROVIDER_CHAIN.length === 0) throw new LLMError("none" as LLMProvider, "No LLM providers configured");

  for (let i = 0; i < PROVIDER_CHAIN.length; i++) {
    const { provider, call } = PROVIDER_CHAIN[i];
    try {
      const result = await call(prompt, opts);
      if (i !== 0) {
        PROVIDER_CHAIN.splice(i, 1);
        PROVIDER_CHAIN.unshift({ provider, call });
      }
      return result;
    } catch (e) {
      if (i === PROVIDER_CHAIN.length - 1) throw new LLMError(provider, "all configured providers failed", e);
    }
  }

  throw new LLMError("none" as LLMProvider, "no providers available");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  callLLM("Say 'ok' and nothing else.")
    .then((r) => console.log(`[${r.provider}] ${r.model} ${r.latencyMs}ms — ${r.text}`))
    .catch((e) => console.error("FAIL:", e.message));
}
