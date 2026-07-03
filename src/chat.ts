import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

import { formatAgentStep, runAgent } from "./agent.js";
import { ask } from "./llm.js";
import { buildPrompt, formatSources } from "./prompt.js";
import { retrieveHybrid } from "./retriever.js";
import { syncIndex } from "./syncIndex.js";
import { editProjectFile } from "./tools/editFile.js";
import { getGitSummary, getRecentDiff, isGitQuestion } from "./tools/git.js";
import { formatGrepResults, grep } from "./tools/grep.js";
import {
  formatImports,
  findReferences,
  formatReferenceResults,
  getImports,
  resetProjectCache,
} from "./tools/references.js";
import {
  formatFileWithLineNumbers,
  readProjectFile,
} from "./tools/readFile.js";
import { syncProjectAfterWrite } from "./tools/registry.js";
import {
  findSymbol,
  formatSymbolResults,
} from "./tools/symbols.js";
import { writeProjectFile } from "./tools/writeFile.js";
import { startWatcher } from "./watcher.js";

const enableWatch = process.argv.includes("--watch");
const simpleMode = process.argv.includes("--simple");

const HELP = `
Commands:
  /help                      Show this help
  /read <path>               Read a project file with line numbers
  /write <path>              Write a file (multiline, end with ---)
  /edit <path> <start> <end> Replace line range (multiline, end with ---)
  /grep <pattern>            Search codebase (regex)
  /find <symbol>             Find function/class/type definitions
  /refs <symbol>             Find all references (AST)
  /imports <path>            List imports in a file
  /git                       Show git status and diff summary
  /reindex                   Run incremental index sync
  exit | quit                Quit

Modes:
  Default     Agent mode — LLM uses tools automatically
  --simple    Single-shot hybrid RAG (no agent loop)
  --watch     Auto-sync index on file changes

Tips:
  Ask natural questions like "Where is ThemeStore used and how does it work?"
`.trim();

async function readMultiline(rl: readline.Interface): Promise<string> {
  console.log("\nEnter content (type --- on its own line to finish):\n");

  const lines: string[] = [];

  while (true) {
    const line = await rl.question("");

    if (line.trim() === "---") {
      break;
    }

    lines.push(line);
  }

  return lines.join("\n");
}

async function handleCommand(
  line: string,
  rl: readline.Interface,
): Promise<boolean> {
  const [command, ...rest] = line.split(/\s+/);

  switch (command.toLowerCase()) {
    case "/help":
      console.log(`\n${HELP}\n`);
      return true;

    case "/read": {
      const arg = rest.join(" ").trim();

      if (!arg) {
        console.log("\nUsage: /read <path>\n");
        return true;
      }

      const content = await readProjectFile(arg);
      console.log(`\n${formatFileWithLineNumbers(arg, content)}\n`);
      return true;
    }

    case "/write": {
      const arg = rest.join(" ").trim();

      if (!arg) {
        console.log("\nUsage: /write <path>\n");
        return true;
      }

      const content = await readMultiline(rl);
      await writeProjectFile(arg, content);
      await syncProjectAfterWrite();
      console.log(`\n✅ Wrote ${arg} (index synced)\n`);
      return true;
    }

    case "/edit": {
      const [filePath, startRaw, endRaw] = rest;

      if (!filePath || !startRaw || !endRaw) {
        console.log("\nUsage: /edit <path> <startLine> <endLine>\n");
        return true;
      }

      const content = await readMultiline(rl);
      await editProjectFile(
        filePath,
        Number(startRaw),
        Number(endRaw),
        content,
      );
      await syncProjectAfterWrite();
      console.log(
        `\n✅ Edited ${filePath}:${startRaw}-${endRaw} (index synced)\n`,
      );
      return true;
    }

    case "/grep": {
      const arg = rest.join(" ").trim();

      if (!arg) {
        console.log("\nUsage: /grep <pattern>\n");
        return true;
      }

      const matches = await grep(arg);
      console.log(`\n${formatGrepResults(matches)}\n`);
      return true;
    }

    case "/find": {
      const arg = rest.join(" ").trim();

      if (!arg) {
        console.log("\nUsage: /find <symbol>\n");
        return true;
      }

      const matches = await findSymbol(arg);
      console.log(`\n${formatSymbolResults(matches)}\n`);
      return true;
    }

    case "/refs": {
      const arg = rest.join(" ").trim();

      if (!arg) {
        console.log("\nUsage: /refs <symbol>\n");
        return true;
      }

      const matches = await findReferences(arg);
      console.log(`\n${formatReferenceResults(matches)}\n`);
      return true;
    }

    case "/imports": {
      const arg = rest.join(" ").trim();

      if (!arg) {
        console.log("\nUsage: /imports <path>\n");
        return true;
      }

      const imports = await getImports(arg);
      console.log(`\n${formatImports(imports)}\n`);
      return true;
    }

    case "/git": {
      const summary = await getGitSummary();
      console.log(`\n${summary}\n`);
      return true;
    }

    case "/reindex": {
      console.log("\nSyncing index...\n");
      resetProjectCache();
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

async function answerSimple(question: string) {
  console.log("\nSearching (hybrid)...\n");

  const chunks = await retrieveHybrid(question);
  let extraContext: string | undefined;

  if (isGitQuestion(question)) {
    try {
      const [summary, diff] = await Promise.all([
        getGitSummary(),
        getRecentDiff(80),
      ]);
      extraContext = `${summary}\n\nRecent diff:\n${diff || "(no diff)"}`;
    } catch {
      // not a git repo
    }
  }

  const prompt = buildPrompt(question, chunks, extraContext);
  const answer = await ask(prompt);

  console.log(`Assistant:\n${answer}\n`);
  console.log("Sources:");
  console.log(formatSources(chunks));
  console.log();
}

async function answerWithAgent(question: string) {
  console.log("\nAgent thinking...\n");

  const answer = await runAgent(question, {
    onStep: (step, toolName, args) => {
      console.log(formatAgentStep(step, toolName, args));
    },
  });

  console.log(`\nAssistant:\n${answer}\n`);
}

async function main() {
  if (enableWatch) {
    startWatcher();
  }

  const rl = readline.createInterface({ input, output });

  const modeLabel = simpleMode ? "simple RAG" : "agent";
  console.log(`AI Coding Assistant (${modeLabel}) — type /help for commands\n`);

  while (true) {
    const question = (await rl.question("You: ")).trim();

    if (!question || question === "exit" || question === "quit") {
      break;
    }

    try {
      if (question.startsWith("/")) {
        await handleCommand(question, rl);
        continue;
      }

      if (simpleMode) {
        await answerSimple(question);
      } else {
        await answerWithAgent(question);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      console.log();
    }
  }

  rl.close();
}

main().catch(console.error);
