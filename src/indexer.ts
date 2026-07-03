import { chunkCode } from "./chunker.js";
import { config } from "./config.js";
import { embedBatch } from "./embedder.js";
import { loadProject, loadProjectFiles, scanProject } from "./loader.js";
import { diffFiles, loadManifest, saveManifest } from "./manifest.js";
import type { Chunk, ProjectFile, StoredChunk } from "./types.js";
import {
  addChunks,
  deleteChunksByPaths,
  saveChunks,
  tableExists,
} from "./vectorStore.js";

const forceFull = process.argv.includes("--full");

async function buildChunks(files: ProjectFile[]): Promise<StoredChunk[]> {
  const allChunks: Chunk[] = [];

  for (const file of files) {
    allChunks.push(...chunkCode(file.path, file.content));
  }

  if (allChunks.length === 0) {
    return [];
  }

  console.log(`Embedding ${allChunks.length} chunks...`);

  const texts = allChunks.map((chunk) => chunk.text);
  const vectors = await embedBatch(texts, 8, (done, total) => {
    console.log(`Embedded ${done}/${total} chunks`);
  });

  return allChunks.map((chunk, index) => ({
    ...chunk,
    vector: vectors[index],
  }));
}

async function fullIndex(): Promise<void> {
  console.log("Running full index...");

  const files = await loadProject();
  console.log(`Found ${files.length} files`);

  const rows = await buildChunks(files);

  if (rows.length === 0) {
    throw new Error("No indexable content found.");
  }

  await saveChunks(rows);

  const scanned = await scanProject();
  await saveManifest(scanned);

  console.log(`✅ Full index saved (${rows.length} chunks)`);
}

async function incrementalIndex(): Promise<void> {
  const currentFiles = await scanProject();
  const manifest = await loadManifest();
  const hasTable = await tableExists();

  const needsFull =
    forceFull ||
    !manifest ||
    !hasTable ||
    manifest.projectPath !== config.projectPath;

  if (needsFull) {
    await fullIndex();
    return;
  }

  const { added, modified, deleted, unchanged } = diffFiles(
    currentFiles,
    manifest.files,
  );

  const changedCount = added.length + modified.length + deleted.length;

  if (changedCount === 0) {
    console.log("✅ Index is up to date — no changes detected.");
    return;
  }

  console.log("Incremental update:");
  console.log(`  Added:     ${added.length}`);
  console.log(`  Modified:  ${modified.length}`);
  console.log(`  Deleted:   ${deleted.length}`);
  console.log(`  Unchanged: ${unchanged.length}`);

  const pathsToRemove = [...deleted, ...modified];

  if (pathsToRemove.length > 0) {
    console.log(`Removing chunks for ${pathsToRemove.length} file(s)...`);
    await deleteChunksByPaths(pathsToRemove);
  }

  const pathsToIndex = [...added, ...modified];

  if (pathsToIndex.length > 0) {
    const files = await loadProjectFiles(pathsToIndex);
    const rows = await buildChunks(files);
    await addChunks(rows);
  }

  await saveManifest(currentFiles);

  console.log("✅ Incremental index updated.");
}

async function main() {
  console.log(`Project: ${config.projectPath}`);

  if (forceFull) {
    console.log("Mode: full (--full flag)");
  } else {
    console.log("Mode: incremental");
  }

  await incrementalIndex();
}

main().catch(console.error);
