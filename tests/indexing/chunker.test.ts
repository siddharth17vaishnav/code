import assert from "node:assert/strict";
import test from "node:test";

import { bootstrapTestEnv } from "../helpers/env.js";

bootstrapTestEnv();

const { chunkCode } = await import("../../src/indexing/chunker.js");

test("chunkCode splits content with overlap", () => {
  const lines = Array.from({ length: 100 }, (_, index) => `line-${index + 1}`);
  const chunks = chunkCode("src/example.ts", lines.join("\n"), {
    maxLines: 80,
    overlap: 20,
  });

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0]?.startLine, 1);
  assert.equal(chunks[0]?.endLine, 80);
  assert.equal(chunks[1]?.startLine, 61);
  assert.equal(chunks[1]?.endLine, 100);
});

test("chunkCode returns one chunk for small files", () => {
  const chunks = chunkCode("README.md", "hello\nworld", {
    maxLines: 80,
    overlap: 20,
  });

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0]?.text, "hello\nworld");
  assert.equal(chunks[0]?.path, "README.md");
});
