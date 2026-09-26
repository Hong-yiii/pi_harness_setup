# Initialize The Lean Pi Profile

Status: Lean profile adopted on 2026-08-03
Date: 2026-08-03

## Scope

This runbook applies the selected Pi profile at user scope so it is available
inside real projects. This repo intentionally has no active local `.pi/`
package list because that would load the same extensions twice.

It intentionally excludes:

- `@season179/pi-worktree` (persistent PR lanes use native Git worktrees),
- Usher,
- OMP,
- `context-mode`,
- Plannotator,
- hashline/read replacement packages,
- extra sidebar/status packages,
- `@quintinshaw/pi-dynamic-workflows`,
- `@malinamnam/pi-phone`.

## Runtime

The selected profile expects and has been verified against:

```bash
@earendil-works/pi-coding-agent@0.83.0
```

Upgrade command:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@0.83.0
```

Verify:

```bash
pi --version
```

Expected:

```text
0.83.0
```

## Apply The Profile

From the repo root:

```bash
node scripts/apply-pi-setup.mjs
```

The target package state is recorded in:

- `pi/package-profiles/lean-default.json`,
- `~/.pi/agent/settings.json` after applying the profile,
- `~/.pi/agent/npm/package-lock.json` as machine-generated installed state.

## Publish Only Reviewed Agents And Prompts

For an agent/prompt-only update, do not run the full apply script: it also
installs packages and republishes settings, skills, and other assets. Review
local differences first; stop if the destination files contain unreviewed
changes. This procedure publishes the five standard agents and four templates
without touching other user configuration.

Run from the repo root in Bash after approving all nine source files:

```bash
set -eu
files=(pi/agent/agents/{scout,researcher,planner,worker,reviewer}.md
       pi/agent/prompts/{research,scout-and-plan,implement,implement-and-review}.md)
backup="$HOME/.config/pi_harness_setup/backups/$(date -u +%Y%m%dT%H%M%SZ)-subagent-contracts"

# Check all destinations before backing up or replacing any file.
for source in "${files[@]}"; do
  target="$HOME/.pi/agent/${source#pi/agent/}"
  test -f "$source"
  test -f "$target"
  test ! -L "$target"
  diff -u "$target" "$source" || test "$?" -eq 1
done
read -r -p 'Review all diffs above. Type publish to replace these files: ' confirmation
test "$confirmation" = publish
mkdir -p "$backup/agents" "$backup/prompts"
printf 'Backup: %s\n' "$backup"
for source in "${files[@]}"; do
  relative="${source#pi/agent/}"
  cp -p "$HOME/.pi/agent/$relative" "$backup/$relative"
done
for source in "${files[@]}"; do
  target="$HOME/.pi/agent/${source#pi/agent/}"
  cp "$source" "$target"
  cmp "$source" "$target"
done
```

The confirmation approves the displayed differences; it cannot decide whether
local edits are intentional. Cancel instead of approving any unreviewed change,
and do not edit the destination files concurrently with publication.

This is not a transactional multi-file update. If any copy fails, restore all
nine files from the printed backup directory before retrying. The procedure
expects an existing installation; use the full profile operation for bootstrap.

Run `/reload` or restart Pi for prompt-template discovery. Verify the resolved
agents with `subagent` list/get and run bounded smoke tasks. A tool allowlist or
read-only acceptance label is not an OS sandbox, and inspection-only `bash`
remains instruction-constrained.

To roll back this asset-only update, copy the five agent files and four template
files from that backup to their matching paths under `~/.pi/agent/`, then reload
Pi. Leave settings, packages, and unrelated definitions alone.

## Guardrails

Ponytail stays in lite mode. The apply script writes the versioned config
template rather than calling package-internal APIs.

The reproducible settings template is:

- `pi/user-config/ponytail-config.json`

The apply script filters package-bundled skills and prompts. Pi Lens still
injects four code-exploration guides from its extension hook; this is a known
tradeoff, not an accidental second skill collection.

`pi-background-tasks` is pinned to `0.6.0`. Later releases add an always-active
multi-model workflow that is outside this profile's background-command scope.

## Existing User Extension Conflict

This machine already had Pi's bundled example `subagent` extension enabled at:

```text
~/.pi/agent/extensions/subagent
```

That conflicts with the selected `pi-subagents` package because both register the `subagent` tool.

For this harness, the user-level `pi-subagents` package is the owner. The bundled symlink was moved to:

```text
~/.pi/agent/extensions.disabled/subagent.bundled-example.disabled-20260803
```

Plan mode remains enabled through the existing bundled `plan-mode` symlink.

## Validation

```bash
pi --version
pi list --approve
npm audit --prefix ~/.pi/agent/npm --omit dev
~/.pi/agent/npm/node_modules/.bin/ast-grep --version
~/.pi/agent/npm/node_modules/.bin/pi-lens build-graph --cwd "$PWD"
pi --approve --no-session --thinking minimal -p "Reply with exactly: harness-smoke-ok"
```

Observed locally on 2026-08-03:

- `pi --version`: `0.83.0`
- `pi list --approve`: the six selected packages are present and
  `@season179/pi-worktree` is absent.
- `npm audit --prefix ~/.pi/agent/npm --omit dev`: `found 0 vulnerabilities`.
- `ast-grep --version`: `ast-grep 0.45.0`.
- `pi-lens build-graph`: completed successfully for this repo.
- Pi smoke prompt printed `harness-smoke-ok`.

The current lean profile exits normally after the print-mode skill-catalog smoke test.

Note: npm warned that `@ast-grep/cli` has a pending install script. The binary is present and functional, so this is documented as a review item rather than an active breakage. Do not approve lifecycle scripts blindly.

## Native Worktree Helper

The apply script publishes `terminal/zsh/piwt.zsh` to:

```text
~/.config/pi_harness_setup/piwt.zsh
```

Source it from zsh, then create a PR lane with `piwt <branch> [base]`. This is a
shell helper rather than a Pi extension: it enters the real Git worktree before
Pi starts, keeping the parent session and subagents on one cwd.

## Rollback

Restore the timestamped files under
`~/.config/pi_harness_setup/backups/`, including `settings.json`, optional
`project-settings.json`, and `ponytail/config.json`, then restart Pi. Package
files can remain installed but inactive; settings determine what loads.

To restore Pi's bundled example subagent instead of the npm `pi-subagents` package:

```bash
mv ~/.pi/agent/extensions.disabled/subagent.bundled-example.disabled-20260803 ~/.pi/agent/extensions/subagent
```

Only do this after removing or disabling `pi-subagents`, otherwise Pi fails to start due to the duplicate `subagent` tool.

If the global Pi runtime upgrade itself needs to be rolled back:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@0.82.0
```

Then rerun:

```bash
pi --version
pi list
```
