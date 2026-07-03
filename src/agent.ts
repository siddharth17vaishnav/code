import { config } from "./config.js";
import {
  isFinalAnswer,
  parseToolCallsFromText,
} from "./parseToolCalls.js";
import { chat, type ChatMessage, type ToolCall } from "./llm.js";
import { retrieveHybrid } from "./retriever.js";
import {
  executeTool,
  getToolDefinitions,
  getToolNames,
} from "./tools/registry.js";
import { getGitSummary, getRecentDiff, isGitQuestion } from "./tools/git.js";
import { buildPrompt } from "./prompt.js";
import { ask } from "./llm.js";

function buildSystemPrompt(): string {
  const toolNames = getToolNames().join(", ");

  return `You are an expert coding assistant exploring a local codebase.

Available tools: ${toolNames}

When you need a tool, respond with ONLY a JSON object (no markdown, no explanation):
{"name": "tool_name", "arguments": {...}}

Examples:
{"name": "search_codebase", "arguments": {"query": "theme styling"}}
{"name": "read_file", "arguments": {"path": "app/page.tsx"}}
{"name": "grep", "arguments": {"pattern": "ThemeProvider"}}

When you have enough context to answer, respond in plain English.
Do NOT return JSON for your final answer. Cite file paths and line numbers.
Do not invent code that is not in the project.`;
}

function normalizeToolCalls(
  native: ToolCall[],
  content: string,
): ToolCall[] {
  if (native.length > 0) {
    return native;
  }

  return parseToolCallsFromText(content).filter((call) =>
    getToolNames().includes(call.name),
  );
}

export interface AgentOptions {
  onStep?: (
    step: number,
    toolName: string,
    args: Record<string, unknown>,
  ) => void;
  maxSteps?: number;
}

export async function runAgent(
  question: string,
  options?: AgentOptions,
): Promise<string> {
  const maxSteps = options?.maxSteps ?? config.agent.maxSteps;

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: question },
  ];

  for (let step = 1; step <= maxSteps; step++) {
    const result = await chat(messages);
    const toolCalls = normalizeToolCalls(result.toolCalls, result.content);

    if (isFinalAnswer(result.content, toolCalls)) {
      return result.content.trim();
    }

    if (toolCalls.length === 0) {
      break;
    }

    messages.push({
      role: "assistant",
      content: result.content,
    });

    for (const toolCall of toolCalls) {
      options?.onStep?.(step, toolCall.name, toolCall.arguments);

      let output: string;

      try {
        output = await executeTool(toolCall.name, toolCall.arguments);
      } catch (error) {
        output =
          error instanceof Error ? error.message : "Tool execution failed.";
      }

      messages.push({
        role: "user",
        content: `[Tool result: ${toolCall.name}]\n${output}\n\nContinue with another tool (JSON only) or provide your final answer in plain English.`,
      });
    }
  }

  return runFallbackAnswer(question);
}

async function runFallbackAnswer(question: string): Promise<string> {
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
      // ignore
    }
  }

  const prompt = buildPrompt(question, chunks, extraContext);
  return ask(prompt);
}

export function formatAgentStep(
  step: number,
  toolName: string,
  args: Record<string, unknown>,
): string {
  const argPreview = JSON.stringify(args);
  const truncated =
    argPreview.length > 80 ? `${argPreview.slice(0, 77)}...` : argPreview;

  return `[step ${step}] ${toolName}(${truncated})`;
}
