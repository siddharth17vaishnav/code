import assert from "node:assert/strict";
import test from "node:test";

import { bootstrapTestEnv } from "../helpers/env.js";

bootstrapTestEnv();

const { appendTurn, formatHistorySummary, trimHistory } = await import(
  "../../src/agent/session.js"
);

test("trimHistory keeps the most recent turns", () => {
  const history = Array.from({ length: 25 }, (_, index) => ({
    role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
    content: `message-${index}`,
  }));

  const trimmed = trimHistory(history);

  assert.equal(trimmed.length, 20);
  assert.equal(trimmed[0]?.content, "message-5");
  assert.equal(trimmed.at(-1)?.content, "message-24");
});

test("appendTurn adds a user and assistant pair", () => {
  const history = appendTurn([], "Where is auth?", "In src/auth.ts");

  assert.equal(history.length, 2);
  assert.equal(history[0]?.role, "user");
  assert.equal(history[1]?.role, "assistant");
  assert.equal(history[1]?.content, "In src/auth.ts");
});

test("formatHistorySummary truncates long messages", () => {
  const longText = "x".repeat(500);
  const summary = formatHistorySummary([
    { role: "user", content: longText },
  ]);

  assert.match(summary, /^User: x{397}\.\.\.$/);
});
