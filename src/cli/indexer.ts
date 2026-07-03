import { config } from "../core/config.js";
import { syncIndex } from "../indexing/syncIndex.js";
import { hasFlag } from "../core/cliArgs.js";
import { runIfDirect } from "../core/cliEntry.js";

export async function runIndexer() {
  const forceFull = hasFlag("--full");

  console.log(`Project: ${config.projectPath}`);
  console.log(`Index storage: ${config.projectStorageDir}`);
  console.log(forceFull ? "Mode: full (--full flag)" : "Mode: incremental");

  await syncIndex({ forceFull });
}

runIfDirect(import.meta.url, runIndexer);
