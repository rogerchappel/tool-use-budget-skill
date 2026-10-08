import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repository = process.cwd();
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tool-use-budget-package-"));

function run(command, args, cwd = repository) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed\n${result.stderr}`);
  return result;
}

try {
  const packageDirectory = path.join(temporaryRoot, "package");
  const consumerDirectory = path.join(temporaryRoot, "consumer");
  fs.mkdirSync(packageDirectory);
  fs.mkdirSync(consumerDirectory);

  const report = JSON.parse(
    run("npm", ["pack", "--json", "--pack-destination", packageDirectory]).stdout
  );
  assert.equal(report.length, 1, "npm pack should produce exactly one artifact");
  assert.equal(report[0].filename, `tool-use-budget-skill-${report[0].version}.tgz`);

  const artifact = path.join(packageDirectory, report[0].filename);
  assert.ok(fs.existsSync(artifact), `packed artifact does not exist: ${artifact}`);
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", artifact], consumerDirectory);

  const bin = path.join(
    consumerDirectory,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "tool-use-budget.cmd" : "tool-use-budget"
  );
  assert.match(run(bin, ["--help"], consumerDirectory).stdout, /^Usage: tool-use-budget /);

  const brief = path.join(consumerDirectory, "brief.md");
  fs.writeFileSync(brief, "Implement tests and update documentation.\n");
  const result = run(
    bin,
    ["--brief", brief, "--format", "json", "--max-minutes", "30"],
    consumerDirectory
  );
  const budget = JSON.parse(result.stdout);
  assert.equal(budget.summary.maxMinutes, 30);
  assert.equal(budget.stages.reduce((sum, stage) => sum + stage.minutes, 0), 30);
  console.log(`package smoke ok: ${report[0].filename}`);
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
