import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

import { ask } from "./llm.js";
import { buildPrompt, formatSources } from "./prompt.js";
import { retrieve } from "./retriever.js";
import { syncIndex } from "./syncIndex.js";
import { formatGrepResults, grep } from "./tools/grep.js";
import {
  formatFileWithLineNumbers,
  readProjectFile,
} from "./tools/readFile.js";
import {
  findSymbol,
  formatSymbolResults,
} from "./tools/symbols.js";
import { startWatcher } from "./watcher.js";

const enableWatch = process.argv.includes("--watch");

const HELP = `
Commands:
  /help                 Show this help
  /read <path>          Read a project file with line numbers
  /grep <pattern>       Search codebase (regex)
  /find <symbol>        Find function/class/type definitions
  /reindex              Run incremental index sync
  exit | quit           Quit

Tips:
  Ask natural questions about your codebase — semantic search runs automatically.
  Use --watch to auto-sync the index when files change.
`.trim();

async function handleCommand(line: string): Promise<boolean> {
  const [command, ...rest] = line.split(/\s+/);
  const arg = rest.join(" ").trim();

  switch (command.toLowerCase()) {
    case "/help":
      console.log(`\n${HELP}\n`);
      return true;

    case "/read": {
      if (!arg) {
        console.log("\nUsage: /read <path>\n");
        return true;
      }

      const content = await readProjectFile(arg);
      console.log(`\n${formatFileWithLineNumbers(arg, content)}\n`);
      return true;
    }

    case "/grep": {
      if (!arg) {
        console.log("\nUsage: /grep <pattern>\n");
        return true;
      }

      const matches = await grep(arg);
      console.log(`\n${formatGrepResults(matches)}\n`);
      return true;
    }

    case "/find": {
      if (!arg) {
        console.log("\nUsage: /find <symbol>\n");
        return true;
      }

      const matches = await findSymbol(arg);
      console.log(`\n${formatSymbolResults(matches)}\n`);
      return true;
    }

    case "/reindex": {
      console.log("\nSyncing index...\n");
      const result = await syncIndex();
      console.log(
        result.mode === "unchanged"
          ? "Index already up to date.\n"
          : "Index sync complete.\n",
      );
      return true;
    }

    default:
      return false;
  }
}

async function answerQuestion(question: string) {
  console.log("\nSearching...\n");

  const chunks = await retrieve(question);
  const prompt = buildPrompt(question, chunks);
  const answer = await ask(prompt);

  console.log(`Assistant:\n${answer}\n`);
  console.log("Sources:");
  console.log(formatSources(chunks));
  console.log();
}

async function main() {
  if (enableWatch) {
    startWatcher();
  }

  const rl = readline.createInterface({ input, output });

  console.log("AI Coding Assistant — type /help for commands\n");

  while (true) {
    const question = (await rl.question("You: ")).trim();

    if (!question || question === "exit" || question === "quit") {
      break;
    }

    try {
      if (question.startsWith("/")) {
        await handleCommand(question);
        continue;
      }

      await answerQuestion(question);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      console.log();
    }
  }

  rl.close();
}

main().catch(console.error);
