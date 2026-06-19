// src/services/api/zenith-stream-parser.ts
// AETHER-ZENITH V15.0 - SOVEREIGN STREAM PARSER
// Optimized for Gemini 3 Flash and universal JSON streaming.

export async function* parseSovereignStream(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Failed to initialize stream reader");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const cleanedLine = line.trim();
      if (!cleanedLine || cleanedLine === "data: [DONE]") continue;

      if (cleanedLine.startsWith("data: ")) {
        try {
          const json = JSON.parse(cleanedLine.replace("data: ", ""));
          const content = json.choices?.[0]?.delta?.content || "";
          if (content) yield content;
          
          // Support for Zenith-specific thinking blocks
          const thinking = json.choices?.[0]?.delta?.thinking;
          if (thinking) yield `\n<thinking>\n${thinking}\n</thinking>\n`;
          
        } catch (e) {
          // Ignore incomplete JSON chunks
        }
      }
    }
  }
}
