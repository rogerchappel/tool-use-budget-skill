# Orchestration Notes

## Inputs

- `brief`: local markdown or text path.
- `profile`: optional local JSON repo profile path.
- `maxMinutes`: optional run budget cap.
- `maxExternalWrites`: optional count, default `0`.
- `format`: `markdown` or `json`.

## Recommended Run Step

```bash
node bin/tool-use-budget.js --brief task.md --profile repo-profile.json --max-minutes 45 --max-external-writes 0
```

## Stop Conditions

- Missing or unreadable task brief.
- Invalid profile JSON.
- Requested external writes when the budget allows none.
- Verification commands are absent for a code-changing task.
- Estimated work exceeds the maximum minutes by more than 25 percent.

## External Actions

This skill does not perform external actions. It can only recommend approval gates for a later workflow.
