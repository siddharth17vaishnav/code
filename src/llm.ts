import { config } from "./config.js";

export async function ask(prompt: string): Promise<string> {
  const response = await fetch(`${config.ollama.baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollama.llm,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama chat error: ${response.status} ${await response.text()}`);
  }

  const json = (await response.json()) as { message: { content: string } };
  return json.message.content;
}
