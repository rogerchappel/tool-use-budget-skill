import fs from "node:fs";

const required = [
  "README.md",
  "SKILL.md",
  "docs/PRD.md",
  "docs/TASKS.md",
  "docs/ORCHESTRATION.md",
  "docs/RELEASE_CANDIDATE.md",
  "src/index.js",
  "bin/tool-use-budget.js",
  "fixtures/task.md",
  "fixtures/profile.json",
  "test/index.test.js"
];

const missing = required.filter((path) => !fs.existsSync(path));
if (missing.length) {
  console.error(`Missing required files:\n${missing.join("\n")}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.bin || !pkg.scripts?.smoke || !pkg.scripts?.test) {
  console.error("package.json must expose bin, test, and smoke scripts.");
  process.exit(1);
}

console.log("check ok");
