# Tool Use Budget Skill

## When To Use

Use this skill before a long or side-effect-sensitive agent run, especially for repo maintenance, connector research, release readiness, content generation, or review work with explicit time and validation constraints.

## Required Inputs

- Task brief as markdown or plain text.
- Optional repo profile with language, package manager, test commands, and risk flags.
- Optional maximum minutes as a positive integer (default 60).
- Optional external-write allowance as a nonnegative integer (default 0).

Each generated stage has a five-minute minimum. The maximum-minutes value must
be large enough to cover every stage selected from the task brief.
Every CLI value flag requires its operand immediately after the flag; an
option token cannot stand in for a missing file, format, or numeric value.

## Side-Effect Boundaries

The skill is dry-run only. It may read local brief/profile files and print a budget. It must not execute commands, edit files, browse, send messages, create PRs, or update external systems.

## Approval Requirements

No approval is needed to create a budget. Explicit approval is required before any downstream workflow performs external writes, publishes content, merges code, installs packages, or spends money.
Researching GitHub, issues, or pull requests is read-only; creating, updating,
sending, publishing, or pushing external artifacts is external-write intent.

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
