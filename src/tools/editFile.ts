import { readProjectFile } from "./readFile.js";
import { writeProjectFile } from "./writeFile.js";

export async function editProjectFile(
  relativePath: string,
  startLine: number,
  endLine: number,
  newContent: string,
): Promise<void> {
  if (startLine < 1 || endLine < startLine) {
    throw new Error("Invalid line range.");
  }

  const content = await readProjectFile(relativePath);
  const lines = content.split("\n");

  if (endLine > lines.length) {
    throw new Error(`End line ${endLine} exceeds file length (${lines.length}).`);
  }

  const updated = [
    ...lines.slice(0, startLine - 1),
    ...newContent.split("\n"),
    ...lines.slice(endLine),
  ];

  await writeProjectFile(relativePath, updated.join("\n"));
}

export async function readProjectLines(
  relativePath: string,
  startLine: number,
  endLine: number,
): Promise<string> {
  const content = await readProjectFile(relativePath);
  const lines = content.split("\n");
  const start = Math.max(1, startLine);
  const end = Math.min(endLine, lines.length);

  return lines.slice(start - 1, end).join("\n");
}
