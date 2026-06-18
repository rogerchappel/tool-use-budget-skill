# Product Requirements

## Goal

Provide a reusable local agent skill that turns a task brief into a concrete, reviewable run budget before tools are used.

## Non-Goals

- Executing the planned work.
- Replacing human approval.
- Tracking live token billing.
- Writing to external systems.

## Core User Stories

- As a coding agent, I can bound exploration, edits, and verification before touching a repo.
- As a research agent, I can state browser and connector limits before collecting context.
- As a reviewer, I can see stop conditions and required approvals before the run starts.

## Functional Requirements

- Read a local task brief.
- Read an optional repo profile JSON file.
- Infer stages from task intent and risk words.
- Emit markdown and JSON budget formats.
- Include tool allowances, elapsed-minute budgets, token estimates, verification gates, and stop conditions.
- Warn when the task asks for external writes without budgeted approval.

## Success Criteria

- Fixture smoke produces a staged markdown budget.
- Tests cover intent detection, profile parsing, warning generation, and rendering.
- Skill instructions clearly prohibit side effects.
