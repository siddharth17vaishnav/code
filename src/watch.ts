import { config } from "./config.js";
import { startWatcher } from "./watcher.js";

async function main() {
  console.log(`Project: ${config.projectPath}`);
  startWatcher();
}

main().catch(console.error);
