import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  getProjectStorageId,
  getProjectStoragePaths,
  normalizeProjectPath,
} from "../../src/core/projectStorage.js";

test("normalizeProjectPath lowercases and normalizes slashes", () => {
  const normalized = normalizeProjectPath("D:\\Projects\\MyApp");

  assert.match(normalized, /^d:\/projects\/myapp$/i);
});

test("getProjectStorageId is stable for the same project path", () => {
  const projectPath = path.resolve("D:/Projects/stable-app");
  const first = getProjectStorageId(projectPath);
  const second = getProjectStorageId("d:\\projects\\stable-app");

  assert.equal(first, second);
  assert.equal(first.length, 16);
});

test("getProjectStoragePaths returns per-project storage layout", () => {
  const projectPath = path.resolve("D:/Projects/layout-app");
  const storage = getProjectStoragePaths(projectPath);

  assert.equal(storage.id, getProjectStorageId(projectPath));
  assert.match(storage.rootDir, new RegExp(`storage[/\\\\]projects[/\\\\]${storage.id}$`));
  assert.match(storage.lanceDbDir, /lancedb$/);
  assert.match(storage.manifestPath, /manifest\.json$/);
});
