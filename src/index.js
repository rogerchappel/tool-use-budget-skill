import fs from "node:fs";

const DEFAULT_PROFILE = {
  language: "unknown",
  packageManager: "unknown",
  testCommands: [],
  riskFlags: []
};

export function readText(path) {
  return fs.readFileSync(path, "utf8");
}

export function readProfile(path) {
  if (!path) return DEFAULT_PROFILE;
  const parsed = JSON.parse(readText(path));
  return {
    language: parsed.language || "unknown",
    packageManager: parsed.packageManager || "unknown",
    testCommands: Array.isArray(parsed.testCommands) ? parsed.testCommands.map(String) : [],
    riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags.map(String) : []
  };
}

export function analyzeBrief(brief) {
  const text = brief.toLowerCase();
  return {
    wantsCode: /\b(code|implement|fix|test|repo|cli|library|build)\b/.test(text),
    wantsResearch: /\b(research|browse|source|company|market|latest|verify)\b/.test(text),
    wantsExternalWrite: /\b(push|publish|send|email|crm|github|issue|pr|deploy|release)\b/.test(text),
    wantsContent: /\b(post|copy|launch|script|readme|docs|content)\b/.test(text),
    highRisk: /\b(legal|medical|financial|credential|secret|production|customer)\b/.test(text)
  };
}

export function buildBudget(brief, profile = DEFAULT_PROFILE, options = {}) {
  const maxMinutes = Number(options.maxMinutes || 60);
  const maxExternalWrites = Number(options.maxExternalWrites || 0);
  const intent = analyzeBrief(brief);
  const stages = [];

  stages.push(stage("Scope", 0.15, 1500, ["file-read", "search"], ["Restate task", "Identify approvals"]));

  if (intent.wantsResearch) {
    stages.push(stage("Research", 0.25, 3500, ["web-search", "web-fetch", "file-read"], ["Capture sources", "Record dates"]));
  }

  if (intent.wantsCode) {
    stages.push(stage("Implementation", 0.35, 5000, ["file-read", "edit", "shell"], ["Keep changes scoped", "Preserve user work"]));
  }

  if (intent.wantsContent) {
    stages.push(stage("Drafting", 0.2, 3000, ["file-read", "render"], ["Use source-backed claims", "Mark assumptions"]));
  }

  const verificationCommands = profile.testCommands.length
    ? profile.testCommands
    : intent.wantsCode
      ? [`${profile.packageManager === "npm" ? "npm test" : "project test command"}`]
      : ["review generated output"];
  stages.push(stage("Verification", 0.2, 2500, ["shell", "file-read"], verificationCommands));

  const totalWeight = stages.reduce((sum, item) => sum + item.weight, 0);
  const normalized = stages.map((item) => ({
    name: item.name,
    minutes: Math.max(5, Math.round((item.weight / totalWeight) * maxMinutes)),
    tokenBudget: item.tokenBudget,
    allowedTools: item.allowedTools,
    gates: item.gates
  }));

  const warnings = buildWarnings(intent, profile, maxExternalWrites, verificationCommands);
  const stopConditions = [
    "Stop when a stage exceeds its minute budget by 25 percent.",
    "Stop before any external write without explicit approval.",
    "Stop if verification commands are missing or fail.",
    "Stop if new private data or credentials appear in the task context."
  ];

  return {
    summary: {
      maxMinutes,
      maxExternalWrites,
      language: profile.language,
      packageManager: profile.packageManager,
      riskFlags: profile.riskFlags
    },
    intent,
    stages: normalized,
    warnings,
    stopConditions
  };
}

export function renderMarkdown(budget) {
  const lines = [
    "# Tool Use Budget",
    "",
    `Max minutes: ${budget.summary.maxMinutes}`,
    `Max external writes: ${budget.summary.maxExternalWrites}`,
    `Language: ${budget.summary.language}`,
    `Package manager: ${budget.summary.packageManager}`,
    "",
    "## Stages",
    "",
    "| Stage | Minutes | Tokens | Tools | Gates |",
    "| --- | ---: | ---: | --- | --- |"
  ];
  for (const item of budget.stages) {
    lines.push(`| ${item.name} | ${item.minutes} | ${item.tokenBudget} | ${item.allowedTools.join(", ")} | ${item.gates.join("; ")} |`);
  }
  lines.push("", "## Warnings");
  if (budget.warnings.length) {
    for (const warning of budget.warnings) lines.push(`- ${warning}`);
  } else {
    lines.push("- None.");
  }
  lines.push("", "## Stop Conditions");
  for (const condition of budget.stopConditions) lines.push(`- ${condition}`);
  return `${lines.join("\n")}\n`;
}

export function renderJson(budget) {
  return `${JSON.stringify(budget, null, 2)}\n`;
}

function stage(name, weight, tokenBudget, allowedTools, gates) {
  return { name, weight, tokenBudget, allowedTools, gates };
}

function buildWarnings(intent, profile, maxExternalWrites, verificationCommands) {
  const warnings = [];
  if (intent.wantsExternalWrite && maxExternalWrites === 0) {
    warnings.push("Task appears to request external writes, but maxExternalWrites is 0.");
  }
  if (intent.wantsCode && verificationCommands.length === 0) {
    warnings.push("Code-changing task has no verification commands.");
  }
  if (intent.highRisk) {
    warnings.push("High-risk terms detected; require explicit approval and source review.");
  }
  if (profile.riskFlags.includes("production")) {
    warnings.push("Profile marks production risk; keep run read-only until approved.");
  }
  return warnings;
}
