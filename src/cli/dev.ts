import { config } from "../core/config.js";
import { loadProject } from "../indexing/loader.js";
import { runIfDirect } from "../core/cliEntry.js";

export async function runDev() {
  console.log(`Project: ${config.projectPath}\n`);

  const files = await loadProject();

  console.log(`Loaded ${files.length} files\n`);

  for (const file of files.slice(0, 20)) {
    console.log(file.path);
  }
}

runIfDirect(import.meta.url, runDev);