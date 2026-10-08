import fs from "node:fs";

function defaultProfile() {
  return {
    language: "unknown",
    packageManager: "unknown",
    testCommands: [],
    riskFlags: []
  };
}

export function readText(path) {
  return fs.readFileSync(path, "utf8");
}

export function readProfile(path) {
  if (!path) return defaultProfile();
  const parsed = JSON.parse(readText(path));
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new TypeError("Profile JSON root must be an object.");
  }
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
    wantsExternalWrite: hasExternalWriteIntent(text),
    wantsContent: /\b(post|copy|launch|script|readme|docs|content)\b/.test(text),
    highRisk: /\b(legal|medical|financial|credential|secret|production|customer)\b/.test(text)
  };
}

function hasExternalWriteIntent(text) {
  const writeAction = "(?:create|open|file|update|edit|comment(?: on)?|close|merge|approve|publish|post|send|email|message|push|deploy|release|delete|remove|assign|upload|schedule|write|insert|add)";
  const externalTarget = "(?:github|issue|pull request|pr|branch|commit|email|message|post|content|release|deployment|crm|google drive|drive|calendar|event|airtable|database|table|record)";
  const actionPattern = new RegExp(`\\b${writeAction}\\b(?:\\s+\\S+){0,5}\\s+\\b${externalTarget}\\b`, "g");

  return text.split(/[.;\n]+/).some((clause) =>
    [...clause.matchAll(actionPattern)].some((match) => {
      const prefix = clause.slice(0, match.index);
      const isResearchFraming = /\b(?:how|whether|who|ways?)\s+to\s+$/.test(prefix);
      const isExplicitlyNegated = /(?:\bdo\s+not|\bdon't|\bnever)\s+$/.test(prefix);
      return !isResearchFraming && !isExplicitlyNegated;
    })
  );
}

export function buildBudget(brief, profile = defaultProfile(), options = {}) {
  const maxMinutes = validateIntegerOption("maxMinutes", options.maxMinutes, 60, 1);
  const maxExternalWrites = validateIntegerOption("maxExternalWrites", options.maxExternalWrites, 0, 0);
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

  const stageMinutes = allocateStageMinutes(stages, maxMinutes);
  const normalized = stages.map((item, index) => ({
    name: item.name,
    minutes: stageMinutes[index],
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
    `Language: ${normalizeMarkdownText(budget.summary.language)}`,
    `Package manager: ${normalizeMarkdownText(budget.summary.packageManager)}`,
    "",
    "## Stages",
    "",
    "| Stage | Minutes | Tokens | Tools | Gates |",
    "| --- | ---: | ---: | --- | --- |"
  ];
  for (const item of budget.stages) {
    const cells = [item.name, item.minutes, item.tokenBudget, item.allowedTools.join(", "), item.gates.join("; ")];
    lines.push(`| ${cells.map(normalizeMarkdownText).join(" | ")} |`);
  }
  lines.push("", "## Warnings");
  if (budget.warnings.length) {
    for (const warning of budget.warnings) lines.push(`- ${normalizeMarkdownText(warning)}`);
  } else {
    lines.push("- None.");
  }
  lines.push("", "## Stop Conditions");
  for (const condition of budget.stopConditions) lines.push(`- ${normalizeMarkdownText(condition)}`);
  return `${lines.join("\n")}\n`;
}

function normalizeMarkdownText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\\", "&#92;")
    .replaceAll("|", "&#124;")
    .replace(/\r\n?|\n/g, "<br>")
    .replace(/([`*_{}\[\]()!])/g, "\\$1");
}

export function renderJson(budget) {
  return `${JSON.stringify(budget, null, 2)}\n`;
}

function stage(name, weight, tokenBudget, allowedTools, gates) {
  return { name, weight, tokenBudget, allowedTools, gates };
}

function validateIntegerOption(name, value, defaultValue, minimum) {
  const resolved = value === undefined ? defaultValue : Number(value);
  if (!Number.isFinite(resolved) || !Number.isInteger(resolved) || resolved < minimum) {
    const constraint = minimum === 0 ? "a nonnegative integer" : "a positive integer";
    throw new TypeError(`${name} must be ${constraint}.`);
  }
  return resolved;
}

function allocateStageMinutes(stages, maxMinutes) {
  const minimumPerStage = 5;
  const minimumTotal = stages.length * minimumPerStage;
  if (maxMinutes < minimumTotal) {
    throw new RangeError(
      `maxMinutes must be at least ${minimumTotal} for ${stages.length} stages (${minimumPerStage} minutes each).`
    );
  }

  const remaining = maxMinutes - minimumTotal;
  const totalWeight = stages.reduce((sum, item) => sum + item.weight, 0);
  const allocations = stages.map((item, index) => {
    const exactShare = (item.weight / totalWeight) * remaining;
    return {
      index,
      minutes: minimumPerStage + Math.floor(exactShare),
      remainder: exactShare - Math.floor(exactShare)
    };
  });
  const allocated = allocations.reduce((sum, item) => sum + item.minutes, 0);

  allocations
    .slice()
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index)
    .slice(0, maxMinutes - allocated)
    .forEach((item) => {
      allocations[item.index].minutes += 1;
    });

  return allocations.map((item) => item.minutes);
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
