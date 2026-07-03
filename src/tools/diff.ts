import fs from "fs/promises";

import { resolveProjectPath, readProjectFile } from "./readFile.js";

function formatLines(label: string, lines: string[]): string {
  if (lines.length === 0) {
    return `${label} (empty)`;
  }

  return `${label}\n${lines.map((line) => `  ${line}`).join("\n")}`;
}

export async function previewWrite(
  relativePath: string,
  newContent: string,
): Promise<string> {
  const fullPath = resolveProjectPath(relativePath);
  let oldContent: string | null = null;

  try {
    await fs.access(fullPath);
    oldContent = await readProjectFile(relativePath);
  } catch {
    oldContent = null;
  }

  if (oldContent === null) {
    const preview = newContent.split("\n").slice(0, 30);
    const suffix =
      newContent.split("\n").length > 30 ? "\n  ... (truncated)" : "";

    return [
      `New file: ${relativePath}`,
      formatLines("Content", preview) + suffix,
    ].join("\n\n");
  }

  return previewReplace(relativePath, oldContent, newContent);
}

export async function previewEdit(
  relativePath: string,
  startLine: number,
  endLine: number,
  newContent: string,
): Promise<string> {
  const oldContent = await readProjectFile(relativePath);
  const lines = oldContent.split("\n");
  const oldLines = lines.slice(startLine - 1, endLine);
  const newLines = newContent.split("\n");

  return [
    `Edit: ${relativePath}:${startLine}-${endLine}`,
    formatLines("- Remove", oldLines),
    formatLines("+ Add", newLines),
  ].join("\n\n");
}

function previewReplace(
  relativePath: string,
  oldContent: string,
  newContent: string,
): string {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  const diffLines: string[] = [`Overwrite: ${relativePath}`];

  for (let index = 0; index < Math.max(oldLines.length, newLines.length); index++) {
    if (diffLines.length >= 40) {
      diffLines.push("... (truncated)");
      break;
    }

    const oldLine = oldLines[index];
    const newLine = newLines[index];

    if (oldLine === newLine) continue;

    if (oldLine !== undefined) {
      diffLines.push(`- ${oldLine}`);
    }

    if (newLine !== undefined) {
      diffLines.push(`+ ${newLine}`);
    }
  }

  return diffLines.join("\n");
}

export const MUTATING_TOOLS = new Set(["write_file", "edit_file"]);

export async function buildMutationPreview(
  toolName: string,
  args: Record<string, unknown>,
): Promise<string> {
  if (toolName === "write_file") {
    return previewWrite(String(args.path ?? ""), String(args.content ?? ""));
  }

  if (toolName === "edit_file") {
    return previewEdit(
      String(args.path ?? ""),
      Number(args.start_line),
      Number(args.end_line),
      String(args.content ?? ""),
    );
  }

  return `Mutation: ${toolName}`;
}
