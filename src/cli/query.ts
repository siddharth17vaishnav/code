import { ask } from "../llm/llm.js";
import { getQueryText } from "../core/cliArgs.js";
import { buildPrompt, formatSources } from "../llm/prompt.js";
import { retrieveHybrid } from "../retrieval/retriever.js";
import { runIfDirect } from "../core/cliEntry.js";

export async function runQuery() {
  const question =
    getQueryText() || "Explain how the theme system works.";

  console.log(`Question: ${question}\n`);
  console.log("Searching index...");

  const chunks = await retrieveHybrid(question);

  console.log(`Found ${chunks.length} relevant chunks\n`);

  const prompt = buildPrompt(question, chunks);
  const answer = await ask(prompt);

  console.log("========== ANSWER ==========\n");
  console.log(answer);
  console.log("\n========== SOURCES ==========\n");
  console.log(formatSources(chunks));
}

runIfDirect(import.meta.url, runQuery);
