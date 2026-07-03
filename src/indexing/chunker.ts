import type { Chunk } from "../core/types.js";
import { config } from "../core/config.js";

export function chunkCode(
  filePath: string,
  content: string,
  options?: { maxLines?: number; overlap?: number },
): Chunk[] {
  const maxLines = options?.maxLines ?? config.chunking.maxLines;
  const overlap = options?.overlap ?? config.chunking.overlap;
  const lines = content.split("\n");
  const chunks: Chunk[] = [];

  let start = 0;
  let index = 0;

  while (start < lines.length) {
    const end = Math.min(start + maxLines, lines.length);

    chunks.push({
      id: `${filePath}:${index}`,
      path: filePath,
      startLine: start + 1,
      endLine: end,
      text: lines.slice(start, end).join("\n"),
    });

    if (end === lines.length) break;

    start += maxLines - overlap;
    index++;
  }

  return chunks;
}
