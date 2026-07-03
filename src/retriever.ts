import { config } from "./config.js";
import { embed } from "./embedder.js";
import { searchChunks } from "./vectorStore.js";
import type { SearchResult } from "./types.js";

export async function retrieve(
  query: string,
  topK = config.retrieval.topK,
): Promise<SearchResult[]> {
  const vector = await embed(query);
  const results = await searchChunks(vector, topK);

  return results.map((row) => ({
    id: row.id as string,
    path: row.path as string,
    startLine: row.startLine as number,
    endLine: row.endLine as number,
    text: row.text as string,
    score: row._distance as number | undefined,
  }));
}
