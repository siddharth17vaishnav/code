import assert from "node:assert/strict";
import test from "node:test";

import { formatDiffPreviewText } from "../../src/tools/diff.js";

test("formatDiffPreviewText renders diff lines with prefixes", () => {
  const text = formatDiffPreviewText({
    title: "Edit lines 1-2",
    path: "src/example.ts",
    summary: "1 line(s) removed, 1 line(s) added",
    lines: [
      { type: "remove", content: "old line" },
      { type: "add", content: "new line" },
    ],
  });

  assert.match(text, /Edit lines 1-2: src\/example\.ts/);
  assert.match(text, /- old line/);
  assert.match(text, /\+ new line/);
});
