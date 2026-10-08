# Release Candidate Notes

## Scope

Initial public build of the dry-run tool budget planning skill.

## Verification

```bash
npm test
npm run check
npm run smoke
```

## Known Limits

- Estimates are heuristic and should be adjusted by the execution agent.
- Token counts are planning bands, not live billing records.
- The tool detects obvious risk words but cannot understand every organization policy.

## Classification

Ship as an MVP for bounded agent-run planning.

## PR Checklist

- Public repository created.
- Main branch contains the initial MVP.
- Release-candidate branch records verification commands.
