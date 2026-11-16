# Sync the shared harness on Mac and Linux

Policy: [ADR 0015](../decisions/0015-enforce-cross-host-harness-parity.md).
Source of truth: `pi/package-profiles/lean-default.json`, `pi/agent/`, `skills/`.

## What is shared

Both hosts run Pi **1.5.2** and the same nine pinned package declarations.
This is npm's latest stable as checked on 2026-11-16. Current publication evidence
is recorded below; historical 1.2.0/1.4.0 checks are not 1.5.2 acceptance.
Open TUI is the only active persistent UI owner; neon-sakura is the selected
palette. Observability stays installed but disabled. BTW commands **and its
bundled `btw` skill** are enabled. The ten repo skills, shared-browser client
extension, five agents, five prompts, global guidance, Ponytail lite, Kimi subagent
default, managed model catalog and 50-task/12-way parallel defaults are published
by the same script.
The Linux browser service is installed separately and never starts during apply;
see [Shared browser](shared-browser.md). Its profiles and client SSH alias remain
host-local.

Fresh installs default to `openai-codex/gpt-6-astra` with `high` thinking for
main. All nine standard subagents resolve to `kimi-coding/k3.1-pro:medium` unless
explicitly overridden. The suffix wins over ordinary role thinking fields;
`pi/agent/models.json` maps Pi `medium` to Kimi API effort `high`, as documented by
Kimi (there is no separate medium tier). Managed models merge by provider/ID;
other models and private provider configuration are preserved. Use fresh context
for Kimi children to avoid signed-fork thinking restrictions. Each host needs its
own Kimi login; credentials are never published. See [Kimi setup](../guides/kimi.md).
Existing parent model/provider/thinking preferences are preserved by normal apply;
the owner separately authorized Astra/high publication to both existing hosts.
Changing the template alone does not force an existing host to switch models.

Host-local: credentials, sessions, npm installation state, OS paths, cmux
transport, fonts, interactive parent model/provider/thinking, unrelated user
packages/settings, and Open TUI preferences absent from its shared template.
Do not rsync `~/.pi` between hosts. A feature promoted on one host must update
the shared sources and this procedure in the same change.

## Pi 1.5.2 full publication — 2026-11-16

Executed on both hosts from the identical reviewed working-tree archive:
`4e9d9ffd258d012d584db71460a6b7ecd7539d13289c33a4cf56c2255ddaf977`.
Each retains `source.tar`, `source.sha256`, and the 130-file manifested source at
`~/.local/share/pi_harness_setup/releases/4e9d9ffd258d012d/`, with a host-local
`deployment.json` receipt. Browser PR #21 is merged at `83fd6e8`; the rollout
source is a separate follow-up PR. Publication is not a Git merge. Both original checkout
HEAD/status/diff records were unchanged during cutover; evidence notes were
updated afterward only in the Mac source checkout.

Until Git is deliberately reconciled, check the deployed source on **each** host:

```bash
cd "$HOME/.local/share/pi_harness_setup/releases/4e9d9ffd258d012d/source"
pi --version  # 1.5.2
node scripts/apply-pi-setup.mjs --check
```

Validation: Mac 67 tests passed / two platform skips; Linux 69 passed. Isolated
and live apply, drift, no-op repeat, real no-model resource/schema/TUI loading and
all nine fresh-context model contracts passed independently on both hosts.
The native pi-schema gate accepts/rejects representative subagent/browser inputs
without executing tools. Main stays Astra/high; subagents Kimi/Pi-medium maps to
API high. Cache warming defaults off. Existing guidance, package pins and
unmanaged preferences were preserved; only the reviewed browser client/skills,
settings and Linux runtime-linked compatibility/plan-mode paths needed publication.
No extension package versions changed. Standalone source TypeScript diagnostics
cannot resolve Pi's virtual host imports without project dependencies; those
editor-only findings remain deferred, while real host loading passed.

No-tools/no-context/no-session live calls returned the expected markers for
Astra/high on both hosts and Kimi/Pi-medium on Mac. Linux Kimi is still **Blocked**
until `/login kimi-coding`; no credentials were copied. Interactive UI, real-session
resume/compaction and native browser viewer/service revalidation remain **Untested**
on 1.5.2. No active Pi/cmux/browser process was restarted. Start a new Pi process
when convenient; `/reload` reloads resources, not the installed runtime.

Recovery (all paths relative to HOME):

| Host | Runtime/launcher recovery | Apply recovery |
| --- | --- | --- |
| Mac | `.config/pi_harness_setup/backups/20261116-pi-1.5.2-runtime/` contains old npm runtime and launcher target | `.config/pi_harness_setup/backups/2026-11-16T07-01-57-218Z-shared-parity/` |
| Linux | Same runtime-receipt directory name; old `.local/opt/pi-1.2.0/` remains intact, with saved launcher | `.config/pi_harness_setup/backups/2026-11-16T07-02-56-855Z-shared-parity/` includes npm/compatibility snapshot |

Mac used its existing npm-global installation; Linux now launches the versioned
`.local/opt/pi-1.5.2/` tree. Restore receipt-owned config and the old launcher/runtime
together if rollback is needed; inspect later edits first. Do not remove old
runtimes while old sessions use them.

Audits: staged Pi runtime trees reported zero vulnerabilities. Retained extensions
reported Mac one high/three moderate and Linux one high/two moderate. These include
[brace-expansion CPU DoS](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr),
[nested-brace recursion](https://github.com/advisories/GHSA-qhr7-859c-m2p7),
[comma recursion](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p),
[minimatch amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249)
(and Lens as its dependent), plus Mac's
[js-yaml merge CPU DoS](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm).
No automatic audit fix or unreviewed extension update was applied; these remain
maintenance follow-up, not a claim that the whole harness audits clean.

## Model-only publication — 2026-11-16

The owner-authorized Astra/high + Kimi/Pi-medium settings and model entry are
published on both hosts without upgrading Pi 1.2.0 or changing agent prompts.
Native catalog and nine fresh-context launch contracts passed on both; the Mac
live default-model smoke passed. Linux still needs `/login kimi-coding`.
Backups, rollback scope and validation limits are in the
[current plan](../current-plan.md#astra-orchestration-and-kimi-subagents--2026-11-16).

This records the earlier model-only step. Its uncommitted source and older Linux
checkout required a separate full publication, recorded above. Do not full-apply
the older checkout: it would restore Sol. Use the retained reviewed snapshot until
the source changes are committed and the dirty checkout is deliberately reconciled.

## Reconcile Git after snapshot publication

The retained release remains immutable. The follow-up branch
`chore/pi-1.5.2-cross-host-rollout` captures its managed assets and final evidence;
its clean homelab review worktree is `~/pi_harness_stable_rollout`. Use that
worktree's `--check` to verify the Git source against the live installation.
The original `~/pi_harness_setup` checkout remains dirty on
`fix/shared-harness-parity`; do not reset, stash, switch or apply it blindly.
Its turn-budget guidance is promoted in this PR; older cmux repair notes and
formatting edits remain untouched in that checkout.

After review/merge, use a clean checkout/worktree of the merged revision, then
run the normal check/apply/check flow below. Reconcile original local edits as a
separate deliberate step. The host-specific rollout/evidence belongs in
[remote_machines](https://github.com/Hong-yiii/remote_machines); this repository
continues to own portable settings, model definitions, pins and apply logic.
No new rollout system or duplicate package manifest is needed.

## Normal refresh (both hosts)

Finish background jobs before any `/reload`; background-tasks 0.6.0 cleans up
its jobs on reload. Do not restart active Pi/cmux sessions merely to update files.
Ensure no other process is installing packages or editing global settings.
The pull flow below is for a **clean, current checkout**. For dirty or older
checkouts, use the reviewed snapshot procedure instead; never reset/stash someone
else's work or run the old apply script merely to clear drift.

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
Auth stores and session files are untouched. Apply reads and merges `models.json`,
which can contain private provider configuration; when changed, its original is
copied only into that host's private recovery backup, never into Git or to another host.

The script no longer runs cmux hooks opportunistically. Transport integration
is OS-specific and follows the [cmux operation](cmux-setup.md).

## Publish a reviewed snapshot without touching dirty checkouts

Review the complete working-tree diff first. Pause source edits while packaging.
Use all tracked working-tree files, plus an **explicitly reviewed** untracked
allowlist; `git archive HEAD` alone omits the pending model entry. Do not include
`.git`, `.pi`, credentials, runtime files or arbitrary untracked directories.
From the reviewed Mac source root:

```bash
export SNAPSHOT_DIR="$(mktemp -d)"
git diff --check
python3 - <<'PY'
import hashlib, io, json, os, pathlib, subprocess, tarfile
root = pathlib.Path.cwd()
out = pathlib.Path(os.environ['SNAPSHOT_DIR'])
files = set(subprocess.check_output(['git', 'ls-files', '-z']).decode().strip('\0').split('\0'))
files.update(['pi/agent/models.json', 'docs/guides/kimi.md'])
manifest = {}
with tarfile.open(out / 'source.tar', 'w') as archive:
    for name in sorted(files):
        p = root / name
        assert not name.startswith(('.git/', '.pi/'))
        assert p.is_file() and not p.is_symlink(), name
        data = p.read_bytes()
        manifest[name] = hashlib.sha256(data).hexdigest()
        archive.add(p, arcname=name, recursive=False)
    receipt = dict(files=manifest,
        head=subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip(),
        status=subprocess.check_output(['git', 'status', '--porcelain=v1']).decode())
    data = (json.dumps(receipt, indent=2) + '\n').encode()
    info = tarfile.TarInfo('SOURCE-MANIFEST.json')
    info.size = len(data)
    archive.addfile(info, io.BytesIO(data))
sha = hashlib.sha256((out / 'source.tar').read_bytes()).hexdigest()
(out / 'source.sha256').write_text(sha + '  source.tar\n')
print(sha)
PY
```

Before any remote operation, record that checkout's `git rev-parse HEAD`,
`git status --porcelain=v1` and `git diff --binary` in a private recovery directory.
Keep the same records for the source checkout after packaging. Transfer only
`source.tar` and `source.sha256` to a private staging directory on the reviewed SSH
host. Verify archive SHA-256 on **both** hosts (`shasum -a 256` on Mac,
`sha256sum -c source.sha256` on Linux), then extract into a new directory outside
the checkouts. Verify every file against `SOURCE-MANIFEST.json` before execution.
Use the same archive digest on both hosts; never substitute the dirty Linux tree.

Rehearse from that source in an isolated HOME containing only a host-local copy
of the installed npm tree and settings/models (no auth or sessions), with the
staged runtime first on PATH. Require source tests, apply, clean `--check`, no-op
repeat apply, the native loader, and model/agent resolution before live cutover.
Retain the archive and source under a private host-local release directory, for
example `~/.local/share/pi_harness_setup/releases/<archive-sha-prefix>/source`.
After backing up and switching the runtime, run from that exact source directory:

```bash
node scripts/apply-pi-setup.mjs
node scripts/apply-pi-setup.mjs --check
node scripts/apply-pi-setup.mjs  # must report Already current
node scripts/check-pi-host-peers.mjs /absolute/path/to/new/pi-coding-agent \
  "$HOME/.pi/agent/npm/node_modules" "$HOME/.pi/agent"
```

Compare original checkout HEAD/status/diff with the saved records before
resuming source edits. Record each host's runtime path, archive digest, apply
receipt and acceptance results. Source snapshots do not merge a PR or commit
pending work. Use the retained snapshot for later checks until Git catches up;
never full-apply an older checkout. Credentials remain host-local throughout.

Pi 1.5.1 changed cache warming's default to `idle`. This profile defaults
`cacheWarming` to `off` to avoid introducing automatic paid background requests;
normal apply preserves an existing explicit host choice.

## Runtime migration

Do not use the old 0.83 bootstrap instructions on an existing runtime. Runtime
changes are separate from normal asset apply. Pi 1.5.2 requires Node >=22.19.
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
`@earendil-works/pi-coding-agent@1.5.2` (`npm install -g --ignore-scripts …`).
Never use sudo npm or replace an unknown Homebrew/installer-managed binary.
Mac deployment must be executed and checked on Mac; Linux cannot certify it.

## Retained extension compatibility

Web 0.17.1, Lens 3.8.74 and Subagents 0.40.0 need the reviewed host-peer backport.
After package installation, apply invokes `repair-pi-host-peers.mjs` only for
those exact versions on Pi 1.5.2. It moves TypeBox/TUI host libraries to peers,
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
exercises native pi-schema validation (including valid/invalid subagent and
browser arguments), checks shared TUI identity, one BTW skill, `/btw:ask`, `/open-tui`, disabled `/obs`,
neon-sakura, `/browser`, one `shared_browser` tool and the selected skills/prompts
without provider calls, browser startup or sessions.
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

## Mac review fixes (historical, before deployment)

PR #17's initial Mac review reproduced two failures: runtime discovery behind
cmux's regular forwarding launcher and `rmSync` rejecting a directory symlink
in a test fixture. Follow-up for [issue #18](https://github.com/Hong-yiii/pi_harness_setup/issues/18)
adds validated npm-host discovery with conflict refusal and uses `unlinkSync`
for the known test symlink, explicitly checking that its target survives.

On macOS / Node 24.4.1, both regression cases failed before the fixes. The
updated full suite passed 35 tests with two Linux-only skips and no failures.
Normal cmux PATH now reaches the expected read-only drift report without
rewriting settings or manifests or creating a recovery snapshot. That review
check alone did not deploy the Mac; the later deployment is recorded below.
CI now runs the self-tests on both Ubuntu and macOS; provider calls and full
interactive acceptance are still separate gates.

## Deployment evidence

### Pi 1.4.0 source validation — 2026-10-31 (not deployment)

A clean temporary HOME on Mac, with real Pi 1.4.0 and the nine unchanged pinned
packages installed through apply, passed drift, no-op repeat apply and the
no-model loader above: no resource warnings/errors, 20 core tool schemas,
Subagents' pi-ai peer isolation, shared Lens/Pi TUI identity and the full profile.
Native agent discovery confirmed nine Sol agents, five role thinking/context
settings and Astra/Sol catalog availability. Standalone Lens built a one-file
graph; analyze help exited successfully. Source regressions: 66 passed, two
platform skips. No live runtime, settings, credentials or sessions were changed.

The isolated extension-tree audit reported two moderate findings: the
[minimatch globparts amplification advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)
and Lens as its affected dependent. No automatic dependency fix or extension
upgrade was applied. Review this before live publication. Linux, existing host
package trees, interactive UI/resume/compaction and provider execution remain
**Untested** on 1.4.0. Keep the old runtime and migrate/check each host separately.

### Merged-source verification — 2026-10-15

[PR #17](https://github.com/Hong-yiii/pi_harness_setup/pull/17) merged as `50e9aea`
and closed issue #18. [Both hosted CI jobs passed](https://github.com/Hong-yiii/pi_harness_setup/actions/runs/38638201092)
on its reviewed head `3b641c0`. Subsequent execution used merged source `50e9aea`.

- **Mac:** normal cmux PATH apply succeeded on Pi 1.2.0 / Node 24.4.1. Managed
  changes were `settings.json`, global `AGENTS.md`, and host-peer compatibility
  repair (quarantined shadow libraries and standalone Lens wrappers). No package
  installation or retained dependency-version upgrade was needed. The real
  no-model loader passed all 20 core tool schemas, TUI identity, shared resources
  and filters without warnings/errors. Drift check passed; repeat apply reported
  `Already current; no writes or installs.` without creating another snapshot.
  Parent provider/model/thinking and unrelated `pi-diff` were preserved.
- **Mac recovery:** complete npm snapshot plus changed configuration and repair
  originals at
  `~/.config/pi_harness_setup/backups/2026-10-15T06-14-12-552Z-shared-parity/`.
  Its receipt records `applied` with an empty package-install list. The prior
  source-work stash was not restored or changed.
- **Linux homelab:** Pi 1.2.0 / Node 24.20.0 was already current. A temporary
  detached worktree at the same merge passed **37 tests, zero failures/skips**,
  managed drift, no-op apply and the real no-model loader. No deployment writes
  were needed. The original checkout remains on `fix/shared-harness-parity`
  at `c8bedbc` with an uncommitted `tests/apply-pi-setup.test.mjs` edit. Its HEAD,
  status and test-diff hash were preserved; the temporary worktree was removed.
  Reconcile that existing edit deliberately before pulling in the primary
  homelab checkout; do not reset or overwrite it merely to match Git branches.

Both live managed installations now pass against the same merged source. This
is runtime/configuration parity, not identical Git working trees or private
state. No credentials/session files, transport, active sessions or services were
changed; no model/provider smoke call or speculative npm audit fix was run.

### Earlier Linux rollout (historical)

Linux was initially applied from local parity changes based on `de00774`
before source publication. Its earlier validation and recovery evidence follows.

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

Full interactive UI/BTW behavior remains **Untested** on the shared revision;
real Mac shared apply and native resource loading now pass as recorded above.
Once background jobs are idle, open a fresh Pi (or `/reload`) and verify one
footer, neon-sakura, `/skill:btw`, `/open-tui`, and a deliberate `/btw:ask` question
with focus/cancel/handoff. Existing sessions were left intact. The original
host-only Mac UI/BTW records remain historical, not the deployment evidence.
