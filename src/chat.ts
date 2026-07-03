import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

import { ask } from "./llm.js";
import { buildPrompt, formatSources } from "./prompt.js";
import { retrieve } from "./retriever.js";

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log("AI Coding Assistant — type a question, or 'exit' to quit\n");

  while (true) {
    const question = (await rl.question("You: ")).trim();

    if (!question || question === "exit" || question === "quit") {
      break;
    }

    try {
      console.log("\nSearching...\n");

      const chunks = await retrieve(question);
      const prompt = buildPrompt(question, chunks);
      const answer = await ask(prompt);

      console.log(`Assistant:\n${answer}\n`);
      console.log("Sources:");
      console.log(formatSources(chunks));
      console.log();
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      console.log();
    }
  }

  rl.close();
}

main().catch(console.error);
