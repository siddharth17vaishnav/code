import { config } from "../core/config.js";
import { startWatcher } from "../indexing/watcher.js";
import { runIfDirect } from "../core/cliEntry.js";

export async function runWatch() {
  console.log(`Project: ${config.projectPath}`);
  startWatcher();
}

runIfDirect(import.meta.url, runWatch);
