#!/usr/bin/env node
import { buildBudget, readProfile, readText, renderJson, renderMarkdown } from "../src/index.js";

function parseArgs(argv) {
  const args = { format: "markdown", maxExternalWrites: 0 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--brief") args.brief = argv[++index];
    else if (arg === "--profile") args.profile = argv[++index];
    else if (arg === "--format") args.format = argv[++index];
    else if (arg === "--max-minutes") args.maxMinutes = Number(argv[++index]);
    else if (arg === "--max-external-writes") args.maxExternalWrites = Number(argv[++index]);
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage() {
  return "Usage: tool-use-budget --brief <file> [--profile <file>] [--format markdown|json] [--max-minutes n] [--max-external-writes n]\n";
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage());
    process.exit(0);
  }
  if (!args.brief) throw new Error("--brief is required.");
  const budget = buildBudget(readText(args.brief), readProfile(args.profile), args);
  if (args.format === "json") process.stdout.write(renderJson(budget));
  else if (args.format === "markdown") process.stdout.write(renderMarkdown(budget));
  else throw new Error(`Unknown format: ${args.format}`);
} catch (error) {
  process.stderr.write(`${error.message}\n${usage()}`);
  process.exit(1);
}
