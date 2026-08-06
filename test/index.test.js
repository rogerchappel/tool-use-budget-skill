import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { analyzeBrief, buildBudget, renderJson, renderMarkdown } from "../src/index.js";

describe("analyzeBrief", () => {
  it("detects code, content, and external write intent", () => {
    const intent = analyzeBrief("Fix the CLI, update README docs, push a branch, and open a PR.");
    assert.equal(intent.wantsCode, true);
    assert.equal(intent.wantsContent, true);
    assert.equal(intent.wantsExternalWrite, true);
  });
});

describe("CLI file and format operands", () => {
  function runCli(...args) {
    return spawnSync(process.execPath, ["bin/tool-use-budget.js", ...args], { encoding: "utf8" });
  }

  for (const flag of ["--brief", "--profile", "--format"]) {
    for (const trailingArgs of [[], ["--help"]]) {
      it(`rejects ${flag} without an operand before ${trailingArgs[0] ?? "end of argv"}`, () => {
        const prefix = flag === "--brief" ? [] : ["--brief", "fixtures/task.md"];
        const result = runCli(...prefix, flag, ...trailingArgs);

        assert.equal(result.status, 1);
        assert.match(result.stderr, new RegExp(`${flag} requires a value`));
        assert.match(result.stderr, /Usage: tool-use-budget/);
      });
    }
  }
});

describe("CLI numeric limits", () => {
  function runCli(...args) {
    return spawnSync(process.execPath, ["bin/tool-use-budget.js", "--brief", "fixtures/task.md", ...args], {
      encoding: "utf8"
    });
  }

  it("reports an exact 45-minute allocation", () => {
    const result = runCli("--format", "json", "--max-minutes", "45");
    assert.equal(result.status, 0, result.stderr);
    const budget = JSON.parse(result.stdout);

    assert.equal(budget.summary.maxMinutes, 45);
    assert.equal(budget.stages.reduce((sum, stage) => sum + stage.minutes, 0), 45);
  });

  for (const flag of ["--max-minutes", "--max-external-writes"]) {
    for (const trailingArgs of [[], ["--format", "json"]]) {
      it(`rejects ${flag} without an operand before ${trailingArgs[0] ?? "end of argv"}`, () => {
        const result = runCli(flag, ...trailingArgs);

        assert.equal(result.status, 1);
        assert.match(result.stderr, new RegExp(`${flag} requires a numeric value`));
        assert.match(result.stderr, /Usage: tool-use-budget/);
      });
    }
  }

  for (const value of ["0", "-1", "NaN", "1.5"]) {
    it(`rejects invalid max minutes ${value}`, () => {
      const result = runCli("--max-minutes", value);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /maxMinutes must be a positive integer/);
    });
  }

  for (const value of ["-1", "NaN", "1.5"]) {
    it(`rejects invalid external writes ${value}`, () => {
      const result = runCli("--max-external-writes", value);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /maxExternalWrites must be a nonnegative integer/);
    });
  }
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

  it("keeps piped verification commands inside the five-column stage table", () => {
    const budget = buildBudget("Implement code and tests.", {
      language: "javascript",
      packageManager: "npm",
      testCommands: ["npm test | tee results.log"],
      riskFlags: []
    });
    const stageRows = renderMarkdown(budget).split("\n").filter((line) => line.startsWith("| "));

    assert.ok(stageRows.every((row) => row.split("|").length === 7));
    assert.match(stageRows.at(-1), /npm test &#124; tee results\.log/);
  });

  it("normalizes special profile fields only when rendering Markdown", () => {
    const budget = buildBudget("Review the result.", {
      language: "Type|Script\n<script>",
      packageManager: "pnpm\\core_*",
      testCommands: ["check\nnext | collect"],
      riskFlags: []
    });
    const markdown = renderMarkdown(budget);

    assert.match(markdown, /Language: Type&#124;Script<br>&lt;script&gt;/);
    assert.match(markdown, /Package manager: pnpm&#92;core\\_\\*/);
    assert.match(markdown, /check<br>next &#124; collect/);
    assert.deepEqual(JSON.parse(renderJson(budget)), budget);
  });
});
