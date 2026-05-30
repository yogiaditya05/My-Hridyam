import { ENV } from "../utils/env";

export type Role = "system" | "user" | "assistant";

export type Message = {
  role: Role;
  content: string;
  name?: string;
};

export type InvokeParams = {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
};

export type InvokeResult = {
  choices: Array<{
    message: {
      role: Role;
      content: string;
    };
  }>;
};

const resolveApiUrl = () => {
  const base = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? ENV.forgeApiUrl.replace(/\/$/, "")
    : "https://openrouter.ai/api";
  return `${base}/v1/chat/completions`;
};

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("API key is not configured. Please set BUILT_IN_FORGE_API_KEY / OPENAI_API_KEY in .env");
  }
};

/**
 * Invokes LLM using OpenRouter / Forge completions endpoint.
 * Configured with parameters optimized for wellness conversations.
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  // Load configuration from env or use defaults
  const model = process.env.LLM_MODEL || "google/gemini-2.5-flash";
  const temp = params.temperature ?? parseFloat(process.env.LLM_TEMPERATURE || "0.75");
  const maxTokens = params.maxTokens ?? parseInt(process.env.LLM_MAX_TOKENS || "500", 10);
  const topP = parseFloat(process.env.LLM_TOP_P || "0.9");
  
  // Presence and frequency penalties to prevent repeating words
  const frequencyPenalty = parseFloat(process.env.LLM_FREQUENCY_PENALTY || "0.2");
  const presencePenalty = parseFloat(process.env.LLM_PRESENCE_PENALTY || "0.2");

  const payload: Record<string, unknown> = {
    model,
    messages: params.messages,
    temperature: temp,
    max_tokens: maxTokens,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
  };

  // Add Gemini/DeepSeek thinking budget parameters only if model indicates reasoning
  if (model.includes("thinking") || model.includes("reasoning")) {
    payload.thinking = {
      budget_tokens: 128
    };
  }

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
      "HTTP-Referer": "https://hridyam.ai", // OpenRouter ranking
      "X-Title": "Hridyam AI Companion",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}
