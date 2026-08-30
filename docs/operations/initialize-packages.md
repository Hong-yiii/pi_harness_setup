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
