import fs from "node:fs";

const required = [
  "README.md",
  "package-lock.json",
  "SKILL.md",
  "docs/PRD.md",
  "docs/TASKS.md",
  "docs/ORCHESTRATION.md",
  "docs/RELEASE_CANDIDATE.md",
  "scripts/package-smoke.js",
  "src/index.js",
  "bin/tool-use-budget.js",
  "fixtures/task.md",
  "fixtures/profile.json",
  "fixtures/profile-research-only.json",
  "fixtures/profile-connector-heavy.json",
  "test/index.test.js"
];

const missing = required.filter((path) => !fs.existsSync(path));
if (missing.length) {
  console.error(`Missing required files:\n${missing.join("\n")}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.bin || !pkg.scripts?.smoke || !pkg.scripts?.["package:smoke"] || !pkg.scripts?.["release:check"] || !pkg.scripts?.test) {
  console.error("package.json must expose bin, test, smoke, package:smoke, and release:check scripts.");
  process.exit(1);
}

for (const path of ["fixtures/profile-research-only.json", "fixtures/profile-connector-heavy.json"]) {
  const profile = JSON.parse(fs.readFileSync(path, "utf8"));
  if (typeof profile.language !== "string" || typeof profile.packageManager !== "string" ||
      !Array.isArray(profile.testCommands) || !Array.isArray(profile.riskFlags)) {
    console.error(`${path} must define language, packageManager, testCommands, and riskFlags.`);
    process.exit(1);
  }
}

console.log("check ok");
