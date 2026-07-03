import path from "path";
import { fileURLToPath } from "url";

export function runIfDirect(
  entryUrl: string,
  run: () => Promise<void>,
): void {
  const entryPath = path.resolve(fileURLToPath(entryUrl));
  const executed = process.argv[1] ? path.resolve(process.argv[1]) : "";

  if (executed === entryPath) {
    run().catch(console.error);
  }
}
