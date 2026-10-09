#!/usr/bin/env node
import { buildBudget, readProfile, readText, renderJson } from "../src/index.js";

const [auditPath, briefPath] = process.argv.slice(2);
if (!auditPath || !briefPath) {
  process.stderr.write("Usage: node scripts/run-audit-budget.js <audit.json> <brief.md>\n");
  process.exit(1);
}

try {
  const audit = JSON.parse(readText(auditPath));
  if (!audit || typeof audit !== "object" || Array.isArray(audit)) {
    throw new TypeError("Run audit JSON root must be an object.");
  }
  if (typeof audit.profile !== "object" || audit.profile === null || Array.isArray(audit.profile)) {
    throw new TypeError("Run audit profile must be an object.");
  }
  const brief = audit.brief ?? readText(briefPath);
  if (typeof brief !== "string") throw new TypeError("Run audit brief must be a string.");
  const budget = buildBudget(brief, readProfileFromAudit(audit.profile), {
    maxMinutes: audit.maxMinutes,
    maxExternalWrites: audit.maxExternalWrites
  });
  process.stdout.write(renderJson(budget));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}

function readProfileFromAudit(profile) {
  return {
    language: profile.language || "unknown",
    packageManager: profile.packageManager || "unknown",
    testCommands: Array.isArray(profile.testCommands) ? profile.testCommands.map(String) : [],
    riskFlags: Array.isArray(profile.riskFlags) ? profile.riskFlags.map(String) : []
  };
}
