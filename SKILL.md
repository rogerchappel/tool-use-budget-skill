# Tool Use Budget Skill

## When To Use

Use this skill before a long or side-effect-sensitive agent run, especially for repo maintenance, connector research, release readiness, content generation, or review work with explicit time and validation constraints.

## Required Inputs

- Task brief as markdown or plain text.
- Optional repo profile with language, package manager, test commands, and risk flags.
- Optional maximum minutes and external-write allowance.

## Side-Effect Boundaries

The skill is dry-run only. It may read local brief/profile files and print a budget. It must not execute commands, edit files, browse, send messages, create PRs, or update external systems.

## Approval Requirements

No approval is needed to create a budget. Explicit approval is required before any downstream workflow performs external writes, publishes content, merges code, installs packages, or spends money.

## Workflow

1. Read the task brief and repo profile.
2. Generate a staged budget with time, token, and tool allowances.
3. Review warnings for ambiguous approvals or excessive scope.
4. Hand the budget to the execution agent.
5. Stop or re-budget if a stage exceeds its limit.

## Examples

```bash
node bin/tool-use-budget.js --brief fixtures/task.md --profile fixtures/profile.json --format markdown
node bin/tool-use-budget.js --brief fixtures/task.md --format json --max-minutes 30
```

## Validation

Run `npm test`, `npm run check`, and `npm run smoke`. Include generated budget output in run handoffs when this skill gates execution.
