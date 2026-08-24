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

  const requiredPackagedFiles = [
    "CHANGELOG.md",
    "LICENSE",
    "README.md",
    "SECURITY.md",
    "SKILL.md",
    "bin/tool-use-budget.js",
    "package.json"
  ];
  const packagedFiles = new Set(report[0].files.map(({ path: file }) => file));
  const missingPackagedFiles = requiredPackagedFiles.filter((file) => !packagedFiles.has(file));
  assert.equal(
    missingPackagedFiles.length,
    0,
    `npm pack omitted required files: ${missingPackagedFiles.join(", ")}`
  );

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

  const profile = path.join(consumerDirectory, "profile.json");
  for (const invalidRoot of [null, [], "profile", 42, true]) {
    fs.writeFileSync(profile, JSON.stringify(invalidRoot));
    const invalidResult = spawnSync(
      bin,
      ["--brief", brief, "--profile", profile, "--format", "json"],
      { cwd: consumerDirectory, encoding: "utf8" }
    );
    assert.equal(invalidResult.status, 1, JSON.stringify(invalidRoot));
    assert.match(invalidResult.stderr, /^Profile JSON root must be an object\./);
    assert.doesNotMatch(invalidResult.stderr, /TypeError|Cannot read properties/);
  }

  fs.writeFileSync(profile, JSON.stringify({ language: "javascript", packageManager: "npm" }));
  const profileBudget = JSON.parse(
    run(bin, ["--brief", brief, "--profile", profile, "--format", "json"], consumerDirectory).stdout
  );
  assert.equal(profileBudget.summary.language, "javascript");
  assert.equal(profileBudget.summary.packageManager, "npm");

  for (const actionBrief of [
    "Delete the GitHub issue.",
    "Remove the release.",
    "Assign the pull request.",
    "Upload the report to Google Drive.",
    "Schedule a Google Calendar event.",
    "Write the result to Airtable."
  ]) {
    fs.writeFileSync(brief, `${actionBrief}\n`);
    const actionResult = run(
      bin,
      ["--brief", brief, "--format", "json", "--max-external-writes", "0"],
      consumerDirectory
    );
    const actionBudget = JSON.parse(actionResult.stdout);
    assert.equal(actionBudget.intent.wantsExternalWrite, true, actionBrief);
    assert.match(actionBudget.warnings.join("\n"), /external writes/, actionBrief);
  }

  for (const researchBrief of [
    "Research how to upload a report to Google Drive.",
    "Review calendar scheduling options.",
    "Read the Airtable table."
  ]) {
    fs.writeFileSync(brief, `${researchBrief}\n`);
    const researchResult = run(
      bin,
      ["--brief", brief, "--format", "json", "--max-external-writes", "0"],
      consumerDirectory
    );
    const researchBudget = JSON.parse(researchResult.stdout);
    assert.equal(researchBudget.intent.wantsExternalWrite, false, researchBrief);
    assert.doesNotMatch(researchBudget.warnings.join("\n"), /external writes/, researchBrief);
  }
  console.log(`package smoke ok: ${report[0].filename}`);
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
