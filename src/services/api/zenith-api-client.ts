import { modelSupportsThinking } from '../../utils/thinking.js';
import { logAPISuccessAndDuration, logAPIError } from './logging.js';

export interface ZenithRequestConfig {
  model: string;
  messages: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEFAULT_MAX_TOKENS = 3000;
const DEFAULT_TEMPERATURE = 0.2;

function isRetryableError(error: Error): boolean {
  const retryableCodes = [
    "ETIMEDOUT", "ECONNRESET", "ENOTFOUND",
    "ECONNREFUSED", "ESOCKETTIMEDOUT", "EPIPE",
    "UND_ERR_SOCKET",
    "network request failed",
    "500 internal server error",
    "502 bad gateway",
    "503 service unavailable",
    "504 gateway timeout",
  ];
  const errorMessage = error.message.toLowerCase();
  const causeMessage = error.cause instanceof Error ? error.cause.message.toLowerCase() : '';

  return retryableCodes.some(code => errorMessage.includes(code)) ||
         (error.cause instanceof Error && retryableCodes.some(code => causeMessage.includes(code)));
}

export async function sendSovereignRequest(config: ZenithRequestConfig): Promise<Response> {
  const startTime = Date.now();
  const isThinkingEnabled = modelSupportsThinking(config.model);
  const endpoint = process.env.ZENITH_API_ENDPOINT || "https://openrouter.ai/api/v1/chat/completions";
  const apiKey = process.env.ZENITH_API_KEY || process.env.AETHER_RELAY_KEY_ALPHA;

  if (!apiKey) {
    throw new Error("AETHER-ZENITH_ERR: No API key configured. Set ZENITH_API_KEY or AETHER_RELAY_KEY_ALPHA.");
  }

  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Title": "AETHER-ZENITH Sovereign Engine V15.0",
    "HTTP-Referer": "https://aether-zenith.ai",
    "Anthropic-Beta": "prompt-caching-2024-07-31"
  };

  const systemPromptMessage = config.systemPrompt ? [{
    role: "system",
    content: config.systemPrompt,
    ...(config.systemPrompt.length > 200 && { cache_control: { type: "ephemeral" } })
  }] : [];

  const modelToUse = config.model.includes('aether') || config.model.includes('zenith')
    ? "google/gemini-2.5-flash"
    : config.model;

  const body = {
    model: modelToUse,
    messages: [
      ...systemPromptMessage,
      ...config.messages
    ],
    temperature: config.temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
    stream: config.stream ?? true,
    ...(isThinkingEnabled && {
      thinking: {
        type: "enabled",
        budget_tokens: parseInt(process.env.MAX_THINKING_TOKENS || "2048", 10)
      }
    })
  };

  let lastError: Error | null = null;
  const startIncludingRetries = Date.now();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = { message: `Failed to parse error response body. HTTP status: ${response.status}`, originalError: jsonError };
        }
        const errorMessage = `Sovereign API Error: ${response.status} - ${JSON.stringify(errorData)}`;
        const apiError = new Error(errorMessage);
        apiError.cause = errorData;

        logAPIError({
          error: apiError,
          model: config.model,
          messageCount: config.messages.length,
          durationMs: Date.now() - startTime,
          attempt,
        });

        if (attempt < MAX_RETRIES && isRetryableError(apiError)) {
          lastError = apiError;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          continue;
        }
        throw apiError;
      }

      try {
        logAPISuccessAndDuration({
          model: config.model,
          preNormalizedModel: config.model,
          start: startTime,
          startIncludingRetries: startIncludingRetries,
          ttftMs: null,
          usage: {
            input_tokens: 0,
            output_tokens: 0,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
          attempt,
          messageCount: config.messages.length,
          messageTokens: 0,
          requestId: null,
          stopReason: null,
          didFallBackToNonStreaming: false,
          querySource: "zenith-api-client",
          costUSD: 0,
        });
      } catch (logErr) {
        console.error("Error logging API success:", logErr);
      }
      return response;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES && isRetryableError(lastError)) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }
      logAPIError({
        error: lastError,
        model: config.model,
        messageCount: config.messages.length,
        durationMs: Date.now() - startTime,
        attempt,
      });
      throw lastError;
    }
  }

  throw lastError ?? new Error("AETHER-ZENITH_ERR: Unexpected retry loop exit without a specific error.");
}

// AETHER-APEX-V39-EVOLVED-STAMP: 1779243992080
