# Tool Use Budget Skill

Tool Use Budget Skill is a dry-run CLI and library for turning an agent task brief into a practical budget for tools, elapsed time, tokens, verification gates, and approval points.

## Quickstart

```bash
npm test
npm run smoke
node bin/tool-use-budget.js --brief fixtures/task.md --profile fixtures/profile.json --format json
```

## Install

```bash
npm install -g tool-use-budget-skill
```

## Example

```bash
tool-use-budget \
  --brief task.md \
  --profile repo-profile.json \
  --max-minutes 45 \
  --max-external-writes 0
```

`--max-minutes` must be a positive integer and defaults to 60. Every generated
stage receives at least five minutes, so the command rejects a limit smaller
than five minutes multiplied by the number of stages required by the brief.
Stage allocations always add up exactly to the declared limit.

`--max-external-writes` must be a nonnegative integer and defaults to 0. The
same constraints apply when passing `maxMinutes` and `maxExternalWrites` to
the `buildBudget` library function.

## Repo Profile

```json
{
  "language": "javascript",
  "packageManager": "npm",
  "testCommands": ["npm test", "npm run check"],
  "riskFlags": ["public-repo", "github-pr"]
}
```

## Verify

Run the release-readiness check before promoting the package:

```bash
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

## Safety Notes

This tool is planning-only. It does not run shell commands, write files, call connectors, or touch external accounts. It surfaces approval gates so a separate agent can ask before taking side-effecting actions.

## Project Status

Release-candidate MVP. See [docs/PRD.md](docs/PRD.md), [docs/TASKS.md](docs/TASKS.md), and [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md).
