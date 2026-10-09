import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "node:test";

it("converts a run-audit JSON fixture into the expected budget report", () => {
  const result = spawnSync(process.execPath, [
    "scripts/run-audit-budget.js", "fixtures/run-audit.json", "fixtures/task.md"
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.summary, {
    maxMinutes: 45,
    maxExternalWrites: 0,
    language: "javascript",
    packageManager: "npm",
    riskFlags: ["public-repo"]
  });
  assert.equal(report.intent.wantsCode, false);
  assert.equal(report.intent.wantsResearch, true);
  assert.equal(report.intent.wantsExternalWrite, false);
  assert.deepEqual(report.stages.map(({ name, minutes }) => ({ name, minutes })), [
    { name: "Scope", minutes: 13 },
    { name: "Research", minutes: 17 },
    { name: "Verification", minutes: 15 }
  ]);
  assert.ok(report.stages.some(({ name, gates }) => name === "Verification" && gates.includes("npm test")));
  assert.ok(report.warnings.some((warning) => warning.includes("High-risk terms detected")));
});

it("rejects malformed audit roots and profiles", () => {
  for (const audit of ["[]", "{\"profile\": []}"]) {
    const directory = mkdtempSync(join(tmpdir(), "run-audit-"));
    const path = join(directory, "audit.json");
    writeFileSync(path, audit);
    try {
      const result = spawnSync(process.execPath, ["scripts/run-audit-budget.js", path, "fixtures/task.md"], { encoding: "utf8" });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Run audit (JSON root|profile) must be an object\./);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});
