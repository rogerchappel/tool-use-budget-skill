# Tool Use Budget Skill

Tool Use Budget Skill is a dry-run CLI and library for turning an agent task brief into a practical budget for tools, elapsed time, tokens, verification gates, and approval points.

## Quickstart

```bash
npm test
npm run smoke
node bin/tool-use-budget.js --brief fixtures/task.md --profile fixtures/profile.json --format json
```

## Install from source

The package is not yet published to the npm registry. Build and install the
tarball from a source checkout:

```bash
git clone https://github.com/rogerchappel/tool-use-budget-skill.git
cd tool-use-budget-skill
npm pack --json
# version 0.1.0 produces tool-use-budget-skill-0.1.0.tgz
npm install --global ./tool-use-budget-skill-0.1.0.tgz
tool-use-budget --help
```

The tarball name follows `<package-name>-<package.json version>.tgz`; use the
`filename` reported by `npm pack --json` after a version change.
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

Every value-taking option requires its operand immediately after the flag.
This includes `--brief`, `--profile`, `--format`, and both numeric limits;
another option cannot be used as the operand.

## Repo Profile

```json
{
  "language": "javascript",
  "packageManager": "npm",
  "testCommands": ["npm test", "npm run check"],
  "riskFlags": ["public-repo", "github-pr"]
}
```

Profile values remain unchanged in JSON output. In Markdown output, reserved
Markdown characters and HTML delimiters are escaped, while line breaks are
normalized to `<br>`. This keeps commands containing pipes, backslashes, or
newlines inside the documented five-column stage table.

## Verify

Run the release-readiness check before promoting the package:

```bash
npm run release:check
```

This packs the project into an operating-system temporary directory, installs
it into a clean temporary consumer, and runs both `tool-use-budget --help` and
a minimal brief through the packaged binary. Temporary files are removed when
the check finishes.

## Safety Notes

This tool is planning-only. It does not run shell commands, write files, call connectors, or touch external accounts. It surfaces approval gates so a separate agent can ask before taking side-effecting actions.

## Project Status

Release-candidate MVP. See [docs/PRD.md](docs/PRD.md), [docs/TASKS.md](docs/TASKS.md), and [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md).
