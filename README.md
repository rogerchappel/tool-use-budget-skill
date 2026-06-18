# Tool Use Budget Skill

Tool Use Budget Skill is a dry-run CLI and library for turning an agent task brief into a practical budget for tools, elapsed time, tokens, verification gates, and approval points.

## Quickstart

```bash
npm test
npm run smoke
node bin/tool-use-budget.js --brief fixtures/task.md --profile fixtures/profile.json --format json
```

## Example

```bash
tool-use-budget \
  --brief task.md \
  --profile repo-profile.json \
  --max-minutes 45 \
  --max-external-writes 0
```

## Repo Profile

```json
{
  "language": "javascript",
  "packageManager": "npm",
  "testCommands": ["npm test", "npm run check"],
  "riskFlags": ["public-repo", "github-pr"]
}
```

## Safety Notes

This tool is planning-only. It does not run shell commands, write files, call connectors, or touch external accounts. It surfaces approval gates so a separate agent can ask before taking side-effecting actions.

## Project Status

Release-candidate MVP. See [docs/PRD.md](docs/PRD.md), [docs/TASKS.md](docs/TASKS.md), and [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md).
