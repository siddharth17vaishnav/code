import { config } from "./config.js";
import { syncIndex } from "./syncIndex.js";

const forceFull = process.argv.includes("--full");

async function main() {
  console.log(`Project: ${config.projectPath}`);
  console.log(forceFull ? "Mode: full (--full flag)" : "Mode: incremental");

  await syncIndex({ forceFull });
}

main().catch(console.error);
