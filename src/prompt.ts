import type { SearchResult } from "./types.js";

export function buildPrompt(question: string, chunks: SearchResult[]): string {
  const context = chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.path}:${chunk.startLine}-${chunk.endLine}\n${chunk.text}`,
    )
    .join("\n\n---\n\n");

  return `You are a coding assistant. Answer based only on the provided code context.
Cite file paths and line numbers when relevant. If the context is insufficient, say so.

Context:
${context}

Question:
${question}`;
}

export function formatSources(chunks: SearchResult[]): string {
  return chunks
    .map((chunk) => `  - ${chunk.path}:${chunk.startLine}-${chunk.endLine}`)
    .join("\n");
}
