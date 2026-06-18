import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeBrief, buildBudget, renderMarkdown } from "../src/index.js";

describe("analyzeBrief", () => {
  it("detects code, content, and external write intent", () => {
    const intent = analyzeBrief("Fix the CLI, update README docs, push a branch, and open a PR.");
    assert.equal(intent.wantsCode, true);
    assert.equal(intent.wantsContent, true);
    assert.equal(intent.wantsExternalWrite, true);
  });
});

describe("buildBudget", () => {
  it("builds staged budgets with profile verification", () => {
    const budget = buildBudget("Implement tests and docs.", {
      language: "javascript",
      packageManager: "npm",
      testCommands: ["npm test"],
      riskFlags: []
    }, { maxMinutes: 40, maxExternalWrites: 0 });
    assert.equal(budget.summary.maxMinutes, 40);
    assert.ok(budget.stages.some((stage) => stage.name === "Implementation"));
    assert.ok(budget.stages.some((stage) => stage.gates.includes("npm test")));
  });

  it("warns about external writes without allowance", () => {
    const budget = buildBudget("Push a branch and create a GitHub PR.", undefined, { maxExternalWrites: 0 });
    assert.match(budget.warnings.join("\n"), /external writes/);
  });

  it("renders markdown output", () => {
    const budget = buildBudget("Research latest docs and draft launch copy.", undefined, { maxMinutes: 30 });
    assert.match(renderMarkdown(budget), /Tool Use Budget/);
    assert.match(renderMarkdown(budget), /Research/);
  });
});
