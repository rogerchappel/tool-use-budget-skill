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
the `buildBudget` library function. Read-only research about GitHub, issues,
or pull requests does not count as external-write intent. Action briefs such
as creating or deleting an issue, sending an update, publishing or assigning
a pull request, removing a release, or pushing a branch do count and produce
a warning when the allowance is zero. Research phrasing such as asking how to
delete an issue remains read-only.

The recognized vocabulary also covers explicit third-party writes such as
uploading a file to Google Drive, scheduling a calendar event, and writing,
inserting, or adding records to Airtable, a database, or a table. The detector
requires a write verb followed closely by a supported target. Read-only briefs
such as researching Drive upload options, reviewing calendar scheduling
options, or reading an Airtable table do not count. This is a conservative
word-pattern heuristic, not a complete connector or policy classifier; use the
stop conditions and explicit approval whenever a brief is ambiguous.

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

The profile file must contain a JSON object at its root. `null`, arrays, and
primitive JSON values are rejected with `Profile JSON root must be an object.`
and exit status 1. Omitting `--profile` continues to use `unknown` language and
package-manager defaults with empty test commands and risk flags.

## Verify

Run the release-readiness check before promoting the package:

```bash
npm run release:check
```

This packs the project into an operating-system temporary directory, verifies
the tarball contains the required release and support files (including the
changelog, security policy, license, README, and skill definition), installs it
into a clean temporary consumer, and runs both `tool-use-budget --help` and a
minimal brief through the packaged binary. Temporary files are removed when the
check finishes.

## Safety Notes

This tool is planning-only. It does not run shell commands, write files, call connectors, or touch external accounts. It surfaces approval gates so a separate agent can ask before taking side-effecting actions.

External-write classification recognizes explicit `do not`, `don't`, and `never` instructions as read-only constraints. An affirmative write elsewhere in the same brief is still classified as an external write.

## Project Status

Release-candidate MVP. See [docs/PRD.md](docs/PRD.md), [docs/TASKS.md](docs/TASKS.md), and [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md).
