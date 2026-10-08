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
    assert.equal(budget.stages.reduce((sum, stage) => sum + stage.minutes, 0), 40);
  });

  it("allocates a 45-minute four-stage budget exactly", () => {
    const budget = buildBudget("Research and implement code.", undefined, {
      maxMinutes: 45
    });

    assert.equal(budget.stages.length, 4);
    assert.equal(budget.stages.reduce((sum, stage) => sum + stage.minutes, 0), 45);
    assert.ok(budget.stages.every((stage) => stage.minutes >= 5));
  });

  it("accepts the exact minimum feasible budget", () => {
    const budget = buildBudget("Implement code and tests.", undefined, { maxMinutes: 15 });

    assert.deepEqual(budget.stages.map((stage) => stage.minutes), [5, 5, 5]);
  });

  it("rejects a budget below the required stage minimum", () => {
    assert.throws(
      () => buildBudget("Implement code and tests.", undefined, { maxMinutes: 14 }),
      /maxMinutes must be at least 15 for 3 stages/
    );
  });

  for (const invalid of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.5, "nope"]) {
    it(`rejects invalid maxMinutes ${String(invalid)}`, () => {
      assert.throws(
        () => buildBudget("Review the result.", undefined, { maxMinutes: invalid }),
        /maxMinutes must be a positive integer/
      );
    });
  }

  for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5, "nope"]) {
    it(`rejects invalid maxExternalWrites ${String(invalid)}`, () => {
      assert.throws(
        () => buildBudget("Review the result.", undefined, { maxExternalWrites: invalid }),
        /maxExternalWrites must be a nonnegative integer/
      );
    });
  }

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
