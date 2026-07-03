import fs from "fs";
import os from "os";
import path from "path";

export function bootstrapTestEnv(): string {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-test-"));

  process.env.PROJECT_PATH = testDir;
  process.env.LLM_MODEL = "qwen2.5-coder:14b";
  process.env.EMBED_MODEL = "nomic-embed-text";
  process.env.OLLAMA_BASE_URL = "http://localhost:11434";
  process.argv = ["node", "test"];

  return testDir;
}
