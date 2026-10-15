# Sync the shared harness on Mac and Linux

Policy: [ADR 0015](../decisions/0015-enforce-cross-host-harness-parity.md).
Source of truth: `pi/package-profiles/lean-default.json`, `pi/agent/`, `skills/`.

## What is shared

Both hosts target Pi **1.2.0** and the same nine pinned package declarations.
Open TUI is the only active persistent UI owner; neon-sakura is the selected
palette. Observability stays installed but disabled. BTW commands **and its
bundled `btw` skill** are enabled. The eight repo skills, five agents, five
prompts, global guidance, Ponytail lite, Sol subagent default and 50-task/12-way
parallel defaults are published by the same script.

Host-local: credentials, sessions, npm installation state, OS paths, cmux
transport, fonts, interactive parent model/provider/thinking, unrelated user
packages/settings, and Open TUI preferences absent from its shared template.
Do not rsync `~/.pi` between hosts. A feature promoted on one host must update
the shared sources and this procedure in the same change.

## Normal refresh (both hosts)

Finish background jobs before any `/reload`; background-tasks 0.6.0 cleans up
its jobs on reload. Do not restart active Pi/cmux sessions merely to update files.
Ensure no other process is installing packages or editing global settings.

```bash
git status --short
git pull --ff-only
pi --version
node scripts/apply-pi-setup.mjs --check
# A nonzero check reports drift; inspect the named paths/packages first.
node scripts/apply-pi-setup.mjs
node scripts/apply-pi-setup.mjs --check
```

Apply refuses a runtime that differs from the profile pin. Direct npm launchers
(including the versioned Linux prefix) resolve through their symlink target.
For a forwarding launcher such as cmux's `pi` shim, discovery falls back to
`npm root -g` and requires the exact Pi package name/version. The wrapper must
forward to that global installation; arbitrary wrappers/custom prefixes are not
inferred. If another discoverable Pi on PATH points to a different root, apply
refuses the ambiguity. Expose the intended npm Pi CLI directly on PATH instead;
do not edit or remove cmux's wrapper. Failed npm discovery or invalid host
metadata stops before backups, installs, or publication.

It installs only
missing/different package pins (no blanket reinstall), preserves unrelated
settings/packages/files, and makes managed values authoritative. JSON formatting
or key order alone is not drift and does not trigger a rewrite. `--assets-only`
publishes configuration without npm operations but requires matching installed
pins, host-peer compatibility and plan-mode linkage.
It refuses symlink destinations and project-local package profiles; resolve those
explicitly rather than writing through a legacy bundled-subagent link.

Backups are private directories under
`~/.config/pi_harness_setup/backups/<timestamp>-shared-parity/`. `receipt.json`
records old/new hashes, originally absent files and completion state. `files/`
mirrors changed paths relative to HOME. Package-changing operations also retain
`npm/` and the exact host-peer repair originals. This is not a multi-file
transaction: on failure stop, inspect the receipt and restore deliberately.
No credentials/session files are read or copied by apply.

The script no longer runs cmux hooks opportunistically. Transport integration
is OS-specific and follows the [cmux operation](cmux-setup.md).

## Runtime migration

Do not use the old 0.83 bootstrap instructions on an existing runtime. Runtime
changes are separate from normal asset apply. Pi 1.2.0 requires Node >=22.19.
Keep a recovery copy/link and all old runtime files while sessions use them.

On a fresh Linux host, the Ubuntu bootstrap reads the Pi pin from the shared
profile, installs it into `~/.local/opt/pi-<version>/`, and exposes its CLI via
`~/.local/bin/pi`. Node remains in its checksum-pinned, user-scoped tree.
The full bootstrap also handles tmux/Hunk and is **not** a routine refresh.

For an existing Linux host, stage only the pinned Pi npm package into a new
user-owned versioned prefix with lifecycle scripts disabled, validate its CLI
and the copied package tree, then back up and atomically repoint the existing
managed `~/.local/bin/pi` link. Do not overwrite the old running runtime.

On Mac, use its existing Pi installation mechanism after backing up its runtime;
for an npm-managed CLI the package is
`@earendil-works/pi-coding-agent@1.2.0` (`npm install -g --ignore-scripts …`).
Never use sudo npm or replace an unknown Homebrew/installer-managed binary.
Mac deployment must be executed and checked on Mac; Linux cannot certify it.

## Retained extension compatibility

Web 0.17.1, Lens 3.8.74 and Subagents 0.40.0 need the reviewed host-peer backport.
After package installation, apply invokes `repair-pi-host-peers.mjs` only for
those exact versions on Pi 1.2.0. It moves TypeBox/TUI host libraries to peers,
quarantines three shadow library paths, and rebuilds standalone-only Lens CLI
wrappers under `~/.config/pi_harness_setup/compat/shared-host-peers/`.

No hook is injected into Pi and no dependency versions are upgraded. npm
reconciliation can undo this installed-file repair. If repairing an otherwise
current install or moving the runtime, use
`node scripts/apply-pi-setup.mjs --repair-peers`, which snapshots an existing npm
tree even when no install is required. Normal apply
also detects and repairs manifest/shadow/wrapper/plan-mode drift without needing
an explicit repair flag; `--check` reports it.
Do not run npm prune/dedupe/audit-fix speculatively. Review audit findings and
verify the native loader, not just CLI help. Older October 7 backups remain valid
historical recovery evidence; see [package operations](initialize-packages.md).

## Verify before calling a host current

```bash
node --test tests/apply-pi-setup.test.mjs
node scripts/apply-pi-setup.mjs --check
# Use the actual npm package root of the selected Pi, not an old runtime path.
node scripts/check-pi-host-peers.mjs /absolute/path/to/pi-coding-agent \
  "$HOME/.pi/agent/npm/node_modules" "$HOME/.pi/agent"
```

The no-model check loads the real installed resources, compiles tool schemas,
checks shared TUI identity, one BTW skill, `/btw:ask`, `/open-tui`, disabled `/obs`,
neon-sakura and the selected skills/prompts without provider calls or sessions.
It is not an interactive acceptance test. In a fresh Pi, verify one footer,
the palette, `/skill:btw`, `/open-tui`, and a deliberate `/btw:ask` question,
focus/cancel/handoff. Side requests use quota and send inherited context to the
provider. Plain `/btw` and `/side` have write/bash authority.

## Rollback

Review current hashes against the receipt before restoring; do not overwrite
later changes. Restore changed files from `files/` to matching HOME-relative
paths. Remove only files marked originally absent whose current hashes still
match the deployment. Never restore settings wholesale over later edits.

For a package-changing failure with `npmSnapshot: true`, preserve the failed
npm tree separately, then restore the saved `npm/` tree intact, including symlinks.
For a fresh install, `npmOriginallyAbsent: true` and `npmSnapshot: false` mean
there is **no** old npm tree to restore: move the partially installed tree out of
resource discovery into the protected recovery directory rather than deleting
it. Likewise preserve any installer-created settings file that was originally
absent before removing it from discovery. On a failed apply, partially written
files may not match the intended `after` hash; inspect them and any subsequent
changes before removal. A later clean retry begins from the recorded absence.
Restore the previous compatibility directory from `host-peers/previous-compat/` if present; otherwise
remove only this deployment's verified new compatibility files. Restore any
saved `plan-mode` link. Repoint the Pi launcher to its separately preserved old
runtime when rolling back a runtime migration. Keep recovery receipts and do
not remove runtimes used by active processes. Validate the restored loader and
start a fresh session when convenient; no daemon/network restart is needed.

## Mac review fixes (no deployment)

PR #17's initial Mac review reproduced two failures: runtime discovery behind
cmux's regular forwarding launcher and `rmSync` rejecting a directory symlink
in a test fixture. Follow-up for [issue #18](https://github.com/Hong-yiii/pi_harness_setup/issues/18)
adds validated npm-host discovery with conflict refusal and uses `unlinkSync`
for the known test symlink, explicitly checking that its target survives.

On macOS / Node 24.4.1, both regression cases failed before the fixes. The
updated full suite passed 35 tests with two Linux-only skips and no failures.
Normal cmux PATH now reaches the expected read-only drift report without
rewriting settings or manifests or creating a recovery snapshot. That check
**does not mean the Mac is deployed**: managed asset/compatibility drift remains.
CI now runs the self-tests on both Ubuntu and macOS; provider calls and full
interactive acceptance are still separate gates.

## Deployment evidence

2026-10-15: Linux was applied from local parity changes based on `de00774`
before source publication. Mac shared-apply acceptance remains pending; merge
this revision, then pull/apply/check on Mac before claiming cross-host parity.

- Final PR gate `b39072ab5`: 33 tests passed, clean workflow YAML/script syntax,
  live drift check and native no-model loader. A formatting-only false drift
  report was reproduced, fixed with semantic JSON comparison, and regression
  tested; no live settings rewrite was needed. Independent follow-up review
  found no findings. Changed-document links also passed.
- Upgrade-copy and clean-HOME installs passed the actual Pi 1.2 loader, including
  compiled schemas, shared TUI identity, BTW skill/commands, one Open TUI owner,
  neon-sakura and selected skills/prompts. Independent review found recovery and
  preflight gaps; regressions fixed them and final re-review had no findings.
- Live task `b4ac9e425` passed the same parity/loader gates and Lens analyze-help.
  Follow-up `be0c88d26` confirmed no-op reapply, a one-file standalone Lens graph,
  and native 50-task/12-concurrent subagent configuration.
  Only theme/package settings changed; parent model and all existing dependency
  versions remained unchanged. No provider call, active-session restart,
  cmux/service/network change or retained worker/listener.
- Runtime/launcher recovery and evidence:
  `~/.config/pi_harness_setup/backups/20261015-parity-runtime-9B3cX5/`.
  Config/npm snapshot:
  `~/.config/pi_harness_setup/backups/2026-10-14T20-13-09-219Z-shared-parity/`.
  Old Pi 1.0.4 files and prior compatibility backups are retained. Do not remove
  them while old sessions use them. The host service registry was updated.
- The upgrade tree retains one pre-existing high `brace-expansion` DoS advisory
  ([GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr));
  related recursion advisories were also reported. No audit-fix was run because
  dependency upgrades were outside this compatibility batch. The clean install
  resolved newer transitive dependencies and audited clean; this is not a claim
  that the existing Linux dependency tree is vulnerability-free.

Full interactive UI/BTW and real Mac shared-apply behavior remain **Untested**.
Open a fresh Pi to use the new runtime/UI; this publication left existing
sessions intact. The original Mac UI/BTW records are historical evidence, not
proof of application of this shared revision.
