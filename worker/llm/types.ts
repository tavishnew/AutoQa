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