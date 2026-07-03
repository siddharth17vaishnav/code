import assert from "node:assert/strict";
import test from "node:test";

import { bootstrapTestEnv } from "../helpers/env.js";

bootstrapTestEnv();

const { diffFiles } = await import("../../src/indexing/manifest.js");

test("diffFiles detects added, modified, deleted, and unchanged files", () => {
  const previous = {
    "src/a.ts": { mtimeMs: 1, size: 10 },
    "src/b.ts": { mtimeMs: 2, size: 20 },
    "src/old.ts": { mtimeMs: 3, size: 30 },
  };

  const current = {
    "src/a.ts": { mtimeMs: 1, size: 10 },
    "src/b.ts": { mtimeMs: 99, size: 20 },
    "src/new.ts": { mtimeMs: 4, size: 40 },
  };

  const result = diffFiles(current, previous);

  assert.deepEqual(result.added, ["src/new.ts"]);
  assert.deepEqual(result.modified, ["src/b.ts"]);
  assert.deepEqual(result.deleted, ["src/old.ts"]);
  assert.deepEqual(result.unchanged, ["src/a.ts"]);
});

test("diffFiles treats size changes as modified", () => {
  const previous = {
    "src/a.ts": { mtimeMs: 1, size: 10 },
  };

  const current = {
    "src/a.ts": { mtimeMs: 1, size: 11 },
  };

  const result = diffFiles(current, previous);

  assert.deepEqual(result.modified, ["src/a.ts"]);
  assert.deepEqual(result.unchanged, []);
});
