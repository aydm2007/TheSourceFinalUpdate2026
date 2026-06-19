// src/services/api/stream.ts
// AETHER-ZENITH V15.0 - SOVEREIGN SSE STREAM PARSER
// Optimized for Gemini 3 Flash and Multi-Provider Logic.

export interface StreamDelta {
  text?: string;
  thinking?: string;
  isFinished: boolean;
}

/**
 * Sovereign Stream Parser - Decuples reasoning from content for Gemini 3 Flash.
 */
export async function* parseZenithStream(response: Response): AsyncGenerator<StreamDelta> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("AETHER-ZENITH_ERR: FATAL_STREAM_CAPTURE_FAILED");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    for (const line of lines) {
      const cleanedLine = line.trim();
      if (!cleanedLine || cleanedLine === "data: [DONE]") continue;

      if (cleanedLine.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(cleanedLine.slice(6));
          const choice = parsed.choices?.[0];
          
          if (choice) {
            const delta = choice.delta;
            const isFinished = choice.finish_reason !== null && choice.finish_reason !== undefined;

            // Extract content and atomic reasoning (thinking)
            yield {
              text: delta?.content || "",
              thinking: delta?.reasoning_content || delta?.reasoning || "", 
              isFinished
            };
          }
        } catch (e) {
          // Skip malformed lines during noisy streaming
          continue;
        }
      }
    }
  }
}
