# Initialize The Lean Pi Profile

Status: Shared cross-host profile; current procedure updated 2026-10-15

For normal refresh, drift checks, exact managed boundaries, runtime migration
and recovery, follow [Shared harness sync](shared-harness-sync.md). Dated
publication/repair records below are historical evidence, not competing defaults.

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

The shared profile pins Pi **1.2.0**. Follow the host-specific runtime migration
in [Shared harness sync](shared-harness-sync.md#runtime-migration); do not
replace a running runtime or rerun the old 0.83 bootstrap. `pi --version` must
match the profile before apply. Open TUI/neon-sakura and BTW with its bundled
skill are shared defaults, not Mac-only overrides.

## Apply The Profile

From the repo root:

```bash
node scripts/apply-pi-setup.mjs --check
node scripts/apply-pi-setup.mjs
node scripts/apply-pi-setup.mjs --check
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

### Recorded Homelab Publication — 2026-09-26

Commit `3b7f931` was fast-forwarded and published as an asset-only update: the
nine files above plus `prompts/deep-research.md`. The nine existing destinations
matched pre-pull commit `ac9b65a`; the new template was absent. Backup and hashed
receipt: `~/.config/pi_harness_setup/backups/20260926T090850Z-homelab-assets/`.
To undo this deployment, restore its nine backed-up files and remove only the
new `~/.pi/agent/prompts/deep-research.md`, then reload Pi. Inspect for subsequent
local edits before restoring or removing anything.

Byte comparisons, native template discovery/argument expansion, live agent
listing, and one fresh read-only planner smoke passed. End-to-end deep research
and HTML delivery remain **Untested**. Node `24.20.0`, Pi `0.84.4`, packages,
settings, skills, credentials, and active sessions were left unchanged; no
bootstrap/full apply or service restart was performed. Run `/reload` in an
existing Pi session to discover the templates.

## Subagent Parallel Capacity — 2026-10-12

The homelab config at `~/.pi/agent/extensions/subagent/config.json` now sets:

```json
{ "parallel": { "maxTasks": 50, "concurrency": 12 } }
```

This allows **50 tasks per top-level batch, 12 running by default**, with the
remainder queued. Session launches remain unlimited; the package's 20-task
per-run ceiling is unchanged. Explicit call/group concurrency overrides the
12-task default, still subject to that ceiling. Separate runs/sessions do not
share a machine-wide semaphore. Keep one writer per checkout; use isolated
worktrees for parallel writers. Provider quotas and RAM still constrain usage.

Source: `pi/agent/extensions/subagent/config.json`. Since the October 15 parity
fix, apply backs up and merges these two fields from the template on both hosts.
Do not replace unrelated configuration, or write through an old bundled-example
symlink. The config-only directory does not install a second extension.

Run `/reload` with children idle, or start a fresh Pi session, to load the new
values. Existing sessions retain their previously loaded config until then.
No package install, active-session restart, model fleet, daemon, or listener is
needed. Real 12-agent provider/resource behavior remains **Untested**.

Recheck config resolution without inference (Node with the installed package's
Jiti loader; native Node type stripping rejects TypeScript under node_modules):

```bash
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const root = `${process.env.HOME}/.pi/agent/npm/node_modules/pi-subagents`;
const { createJiti } = createRequire(`${root}/index.ts`)('jiti');
const jiti = createJiti(import.meta.url, { fsCache: false });
const { loadConfig } = await jiti.import(`${root}/src/extension/config.ts`);
const config = loadConfig();
assert.deepEqual(config.parallel, { maxTasks: 50, concurrency: 12 });
assert.equal(config.globalConcurrencyLimit ?? 20, 20);
assert.equal(config.maxSubagentSpawnsPerSession ?? 0, 0);
console.log('PASS: 50 tasks/batch, 12 concurrent by default; other caps unchanged');
JS
```

Recovery receipt: `~/.config/pi_harness_setup/backups/20261012T140645Z-subagent-parallel/`.
The destination was absent before publication; `before.json` records that and
hashes of unchanged settings, agent definitions, and npm manifests/lockfile.
`check.mjs` is the retained runnable no-model regression; `verified.json` records
source/live equality, unchanged protected files, and all 50 scheduler items
completed with peak concurrency 12. This does not prove real provider throughput.
Rollback: remove just the two parallel fields after checking for later edits;
if the entire config still matches the deployed hash, remove only that new
file and its directory if empty. Reload Pi to recover defaults (8 tasks/batch,
4 concurrent). Keep the versioned template consistent. Do not restore the host
handbook or unrelated settings wholesale.

## Subagent Model Default — 2026-10-12

All nine discovered homelab subagents now default to
`openai-codex/gpt-6.1-sol` through `subagents.defaultModel` in
`~/.pi/agent/settings.json` and the versioned settings template. The five
standard agents omit `model` and retain their former suffixes as `thinking`:
scout/researcher medium, planner/reviewer high, worker xhigh. Parent model,
prompts, tools, packages, credentials, and active sessions were not changed.
The full apply script was not run for that historical publication. Since the
October 15 parity fix, apply enforces the shared subagent model while preserving
the parent model selection and unrelated settings.

Verification: `pi --list-models 6.1`, native agent discovery (all nine), source/live
byte equality, unchanged-unrelated-settings assertions, and the live `subagent`
`models`/scout `get` actions passed. No inference call was made (**Untested**).
For rechecks use `/subagents-models` and `subagent` list/get; existing sessions may
need `/reload`. Explicit agent/project/per-run model overrides still take priority.

Backup of settings and five agents:
`~/.config/pi_harness_setup/backups/20261011T192826Z-subagent-sol/`.
Rollback: after reviewing subsequent edits, remove only the added
`subagents.defaultModel` (absent before this change), restore the five agents
from `agents/` in that backup, and reload. Do not restore unrelated settings or
the host handbook wholesale. Revert the corresponding source fields to keep
future publication consistent. No worker, listener, or service restart was added.

## Homelab Host-Dependency Backport — 2026-10-07

The host was inspected at Node `24.20.0` / Pi `1.0.4` (not the older rebuild
pin above). The user authorized fixing three host-dependency warnings without
upgrading the extensions. Existing versions and package owners were preserved.

Manifest changes under `~/.pi/agent/npm/node_modules/`:

| Package | Manifest repair |
| --- | --- |
| `pi-web-access@0.17.1` | Move `typebox` from dependencies to peerDependencies, range `"*"`. |
| `pi-lens@3.8.74` | Move `typebox` and `@earendil-works/pi-tui` to wildcard peers. |
| `pi-subagents@0.40.0` | Move `typebox` to a wildcard peer; normalize the existing `pi-ai` peer to `"*"`. |

Three duplicate library directories were quarantined with intact backups:
`typebox`, `pi-subagents/node_modules/typebox`, and `@earendil-works/pi-tui`.
These paths are now **absent**, with no replacement symlinks. An interim
symlink attempt was rolled back: even a link to the host's physical library
bypasses Pi's bundled runtime and creates a distinct TUI class.

Removal also affects standalone Lens CLIs. Their three npm `.bin` symlinks now
point to bounded launch wrappers under
`~/.config/pi_harness_setup/compat/host-peers-20261007/bin/`. Each executes the
absolute Node binary with a deployed copy of
[`scripts/pi-lens-host-cli.mjs`](../../scripts/pi-lens-host-cli.mjs), passing
the absolute Pi package root and the original Lens entrypoint: `cli.js` for
`pi-lens`, `analyze-cli.js` for `pi-lens-analyze`, and `server.js` for
`pi-lens-mcp`, all under `pi-lens/dist/mcp/`. The launcher preserves arguments
and resolves TypeBox/TUI imports through the host only in that separate CLI
process. It is **not** loaded by Pi, a global `NODE_OPTIONS` hook, or a daemon.
Keep using the `.bin` commands, not `node dist/mcp/cli.js` directly.

Backup and receipts:
`~/.config/pi_harness_setup/backups/20261007T065208Z-host-peers/`.
`manifests/` contains the three originals; `libraries/` retains the duplicate
libraries; `bin/` retains original npm bin symlinks. `repair.json` records absent
library paths, wrapper targets, and patched/deployed file hashes.
`protected-hashes.json` verifies untouched settings, npm root manifest, and both
lockfiles. `final-check.log` and `final-lens-cli.log` are the accepted evidence;
`symlink-trial.json` and `symlink-identity-failure.log` preserve the rejected
attempt. No credential/session data, extension source, package pins, shared
services, listeners, or active sessions changed.

Validation passed in a disposable package-tree copy and against the live install:

- baseline reproduced all three warnings; repaired bundled loader reported zero
  warnings/errors and registered all 20 tools;
- all 20 parameter schemas compiled with the bundled host's TypeBox;
- native resolution from the extensions cannot find shadow TypeBox/TUI copies;
  Lens's compiled accessor and Pi's loader return the **same Text class**;
- the regression rejected the symlink approach before accepting removal;
- the standalone `pi-lens` wrapper built a one-file graph and
  `pi-lens-analyze --help` passed; MCP server behavior remains **Untested**;
- settings and npm root/lockfile hashes remained unchanged.

CLI help/model-list exits did not exercise extension factories in this build;
they are not used as load evidence. No model calls or persistent workers were
started. End-to-end tool/session behavior remains **Untested** by this check.
Start a fresh Pi process when convenient; already-running processes can retain
previously loaded modules.

### Recheck after package or runtime maintenance

This is a local installed-file backport, **not** an upstream release or lockfile
change. Reinstall, update, npm reconciliation, or full profile apply can overwrite
the manifests/bin links or restore shadow libraries. A moved Pi runtime can
invalidate launcher paths. Do not run
`npm install`, `npm prune`, or `npm dedupe` simply to reconcile this intentional
local difference. Prefer a reviewed upstream upgrade once its compatibility and
peer declarations pass the same checks; do not blindly reapply to other versions.

From the repository root, run the regression without a model call:

```bash
host="$HOME/.local/opt/node-v24.20.0-linux-x64/lib/node_modules/@earendil-works/pi-coding-agent"
timeout 90 node scripts/check-pi-host-peers.mjs "$host" \
  "$HOME/.pi/agent/npm/node_modules"
```

The check creates and removes its own temporary fixture. It uses this Pi build's
bundled-loader exports, so review it when changing Pi versions. It checks loading,
schemas, peers, shadow resolution, and class identity, not full session behavior.
The extension fixes and CLI launchers are not automatically published by the
full profile script. Repeat only after version/path review, backup, and the same
isolated/live checks.

### Rollback

Compare current manifest/launcher hashes, bin link targets, and absent library
paths with `repair.json` first; stop if any differ. Restore the three manifests
from `manifests/` and library directories from `libraries/`. Unlink only the
three verified `.bin/pi-lens*` repair links, then restore the saved symlinks from
`bin/`. Remove the repair-only compatibility directory only after its file
hashes match the receipt and the original bin commands work again. Do not
restore unrelated settings/locks or the backed-up host handbook wholesale.
Start a fresh Pi process and expect the original warnings. Record rollback here
and in the host registry; preserve the logs/receipt for diagnosis.

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

Current shared-profile/runtime rollback uses the receipt and snapshot layout in
[Shared harness sync](shared-harness-sync.md#rollback). The remaining notes
below describe the original August layout only; do not use them for new receipts.

Restore the timestamped files under
`~/.config/pi_harness_setup/backups/`, including `settings.json`, optional
`project-settings.json`, and `ponytail/config.json`, then restart Pi. Package
files can remain installed but inactive; settings determine what loads.

To restore Pi's bundled example subagent instead of the npm `pi-subagents` package:

```bash
test ! -e ~/.pi/agent/extensions/subagent && \
  mv ~/.pi/agent/extensions.disabled/subagent.bundled-example.disabled-20260803 ~/.pi/agent/extensions/subagent
```

Only do this after removing or disabling `pi-subagents`, otherwise Pi fails to start due to the duplicate `subagent` tool. If the new config-only `subagent/`
directory exists, first preserve it outside extension discovery and remove the
verified config and empty directory deliberately; do not nest the old extension
inside it.

For a runtime rollback, restore the separately preserved launcher/runtime from
the deployment receipt. Do not install an arbitrary historical version or
replace files still used by active Pi sessions. Then rerun:

```bash
pi --version
pi list
```
