# cmux 0.65.1 Coordinated Upgrade

Status: Mac and Linux helper updated on 2026-10-14; core native acceptance passed.
Linux session-API browser/notification delivery passed on 2026-10-15 (below).
The legacy remote `cmux` wrapper was not repaired; broader browser limits remain.

This is a record of manually driven native checks, not a PASS receipt from
[`cmux-upgrade.md`](cmux-upgrade.md)'s automated runner. That runner was not
executed here: its local-browser control, `localhost` alias, receipt comparison,
and other required gates must not be inferred from this narrower IPv4 test.

## Completed

- Verified stable release v0.65.1 includes SSH-browser fix #18956 and forward
  parent-exit cleanup #19808. Issue #19642 is closed.
- User confirmed checkpointing and permitted normal app quit. The installation
  controller ran in iTerm2; ordinary SSH to the Linux x86_64 homelab passed.
- Backed up Mac 0.64.25 app and preferences, application support/WebKit state,
  cmux session/runtime directories and terminal configuration after normal quit.
  Runtime sockets were excluded. Retained the original app separately.
- Installed **0.65.1 (110), commit `8a853dcc9`** from the official universal DMG.
  SHA-256: `264933be1db770667df5b6cf09045ff48203f99dd96ad5f801ff676f915b5850`.
  Strict code signing and Gatekeeper passed: notarized Manaflow, Inc.
  (`7WLXT3NR37`).
- App bundles cmux-tui build `5f39d4fc6dcbe25ce117bb476e939b6c23959109`,
  distribution `0.0.0-r2.sha-5f39d4fc6dcbe25ce117bb476e939b6c23959109`,
  remote protocol 5. The bundled SSH manifest pins Linux x86_64 binary SHA-256
  `11bcbec237b1ce8b80337e171c74961fbf9cdc59377746470bdefcd04128c9cb`.
- Launched with `CMUX_DISABLE_SESSION_RESTORE=1` to avoid automatically activating
  or migrating previous workspaces. Automatic checking/downloading remains off
  through `SUEnableAutomaticChecks=false`, `SUAutomaticallyUpdate=false`.
- Backed up the remote on-disk cmux-tui executable before any bootstrap. That
  pre-upgrade copy reports `c18c5c1243f4b5a7a41dd84b89b113b29749ff43`, protocol 5.
  Existing Rust and 0.64.25 legacy owners remain untouched. This is an executable
  backup, not a consistent snapshot of live remote session state.

## Private Recovery Locations

Mac:

```text
~/.config/pi_harness_setup/backups/cmux-0.65.1-upgrade-<date>-<private-run-id>/
```

`pre-cutover/` contains the app copy, preferences, state tree and backup receipt;
`cmux-0.64.25-original.app` retains the original installed app. Keep all state
private. For recovery, checkpoint new work, quit from an independent controller,
back up post-upgrade state, then review restoring the matching app/preferences/
state together. Do not overwrite running sessions or merge incompatible snapshots.

Linux:

```text
~/.config/pi_harness_setup/backups/cmux-0.65.1-upgrade-<date>-<private-run-id>/
```

The old on-disk binary hash is
`871cdf8e6f15155e6e255890f9f7675b0a3c693282843cca557afd5d32a2cb1a`.
No shared owner was stopped; do not replace a running owner's executable in place.

## Native Acceptance — 2026-10-14

- Resumed the controller inside cmux; `cmux ping` passed without changing
  `cmuxOnly`. Initial native bootstrap timed out. A no-install probe confirmed
  the old Linux distribution was incompatible despite the shared protocol number.
- Downloaded the Linux binary from the official commit-addressed
  `files.cmux.com/cmux-tui/5f39d4fc6dcbe25ce117bb476e939b6c23959109/`
  payload location. Verified its SHA-256 against the signed app's manifest.
  An initial SCP timed out with a partial staging file; compressed transfer then
  completed and passed checksum/probe verification on Linux.
- Verified the old installed binary still matched its backup, then replaced it
  atomically by rename. No running owner was killed or upgraded forcibly.
- Fresh `cmux ssh homelab --name cmux-v0651-smoke` succeeded with backend
  `cmux-tui`, connected and daemon ready. Terminal input/output and the new
  helper version passed. Post-test executable hashing found two running new-build
  processes and ten old-build processes: existing durable owners remain old by
  design, not every live process has migrated.
- With independent five-minute Linux and Mac fixtures on loopback port 28766,
  native browser navigation rendered the unique Linux marker twice. Linux logs
  recorded both fresh query URLs; the Mac decoy recorded only our explicit curl
  control, not those browser requests. Browser URL used cmux's own forward port
  58227; no manual SSH tunnel was involved.
- Stopped only the Linux fixture while leaving the Mac decoy running. A fresh
  navigation failed with `navigation_failed` and a native error page; it did not
  render the Mac decoy. Public `https://example.com` rendered `Example Domain`.
- Remote OSC 777 notification arrived in the native notification list. The
  separate `cmux notify` CLI check failed because `cmux` is not on the fresh remote
  shell PATH; that compatibility issue was not repaired by altering shell config.
- Both fixtures exited cleanly. Exited the disposable remote shell and closed only
  the test browser tabs/workspace. The app retained its test forward after tab/
  workspace close; stopped that exact verified `cmux-tui remote forward` process
  for port 28766. Verified Mac fixture/forward ports and Linux fixture port closed.
  The test notification was removed with its workspace.
- Full app quit/crash cleanup from #19808 was **not** exercised: it would interrupt
  other work. Native notification delivery does not validate automatic Pi hooks.

Exact backup directories and execution logs remain host-local; the Linux service
registry was updated with activation, results, and recovery references. No test
server or manual tunnel remains. Old session owners and private recovery material
are intentionally retained.

## Linux-Initiated Delivery Acceptance — 2026-10-15

The old wrapper still targeted a dead legacy reverse-forward port. That did not
mean the Linux owner or native SSH link was broken. The replacement is the
existing cmux-tui session API, not a new tunnel or global CLI alias.

### Upstream chronology

- **0.65.0, October 5:** persistent `cmux ssh` moved to cmux-tui, unifying
  reconnect, restore, splits, and tabs ([#12956](https://github.com/manaflow-ai/cmux/pull/12956)).
  [Tag-pinned changelog](https://github.com/manaflow-ai/cmux/blob/v0.65.1/CHANGELOG.md).
- Notification-ledger synchronization already existed in
  [v0.65.0](https://github.com/manaflow-ai/cmux/blob/v0.65.0/Sources/Surfaces/CmuxTuiSurfaceProvider%2BNotifications.swift).
  Its first introduction is not established here; it was not all added in 0.65.1.
- **0.65.1, October 12:** native SSH browser loading/loopback forwarding
  [#18956](https://github.com/manaflow-ai/cmux/pull/18956) and app-exit forward
  cleanup [#19808](https://github.com/manaflow-ai/cmux/pull/19808) followed.
- Managed SSH and [legacy relay configurations are distinct](https://github.com/manaflow-ai/cmux/blob/v0.65.1/Sources/RemoteTui/Workspace%2BSSHTui.swift).
  The [legacy relay policy](https://github.com/manaflow-ai/cmux/blob/v0.65.1/daemon/remote/README.md#cli-relay)
  denies browser methods; reviving it is not equivalent to adopting the new API.

### Executed manual checks

Created one uniquely named native SSH workspace with `--no-focus`, no Pi writer,
and two ten-minute HTTP fixtures: Linux loopback and a same-port Mac decoy.
They served synthetic markers only. Read-only identity checks established the
old owner build `c18c5c…`, installed helper `5f39d4…`, and exact
Linux-terminal/native-workspace mapping. The owner PID/generation were unchanged
at cleanup. These are manual results, not the automated upgrade runner's receipts.

| Check | Observed result |
| --- | --- |
| Explicit Linux socket ping and resource queries | Passed against the preserved owner with the new installed CLI |
| `pane <test-pane> tab create browser --url <Linux-HTTP-URL>` | Returned Linux browser/tab/workspace IDs; native tab appeared without changing selected workspace |
| Native body inspection | Rendered the unique Linux marker; Linux logged requests and Mac decoy logged none |
| Origin loss | Stopped Linux fixture; fresh native navigation failed, not the still-running Mac decoy |
| `notification create --terminal <test-terminal>` | Unique body appeared in the correct Mac workspace/terminal |
| `notification clear --terminal <test-terminal>` | Removed the Linux row and native notification |
| Scoped resource cleanup | Closed recorded browser tab, test terminal, and test workspace via Linux API; native test workspace disappeared |
| Listener cleanup | Fixtures stopped; exact retained test forward stopped; fixture and forward ports verified closed |
| Existing work | Original terminal remained present; shared owner was not restarted |

Native browser handles changed during initial reconciliation. An early read
using a stale handle failed; resolving the current UUID and reading `body` then
succeeded. Keep Linux receipts and re-query native handles, not browser creation.
Linux browser state remained `starting` while **Mac WebKit** rendered the page.
The separate TUI/CDP renderer's state is not native render acceptance.

Reproduce with the [delivery recipe](../../skills/teach/references/artifact-delivery.md)
in a disposable workspace. Match terminal/resource identity, never title. Source:
[native browser materialization/HTTP forwarding](https://github.com/manaflow-ai/cmux/blob/v0.65.1/Sources/Surfaces/CmuxTuiSurfaceProvider%2BPortForward.swift),
[notification synchronization](https://github.com/manaflow-ai/cmux/blob/v0.65.1/Sources/Surfaces/CmuxTuiSurfaceProvider%2BNotifications.swift).

Raw execution logs and receipts stay host-local. Tab/workspace close still left
the cmux-managed forward alive; only that positively identified test forward was
terminated. Full app-exit cleanup, reconnect while serving an artifact, HTTPS,
and automatic Pi hooks were not tested. No acceptance-runner assertion or backend
guard was weakened.

`teach` and deep-research now share the instruction-only recipe. Their three
asset files were backed up and published to both hosts, without full apply.
See [the current plan](../current-plan.md#cmux-remote-artifact-delivery-migration--2026-10-15)
for publication and rollback. Local Mac artifacts still open directly without
an HTTP server; Linux artifacts use explicit session identity and loopback HTTP.

## Normal Use and Remaining Limits

Keep the `cmuxOnly` policy intact. From a **local terminal inside cmux**, create
one fresh named SSH test workspace; do not resume duplicate Pi writers:

```bash
cmux ssh homelab --name cmux-v0651-smoke
```

A new client/binary does not prove existing durable owners migrated. Retire old
owners only after their dependent sessions and recovery paths are accounted for.
If bootstrap requests replacing a sidecar or stopping a session, review its scope
before approving; do not force upgrades or stop unrelated owners.

The core checks above passed on a fresh workspace. Re-run equivalent bounded
checks after future transport changes; do not modify a backend-specific
acceptance runner simply to pass.

PR #18956 lists remaining limitations for absolute localhost subresources/
WebSockets and SSH-host HTTPS. Do not equate one successful HTML document with
complete support for those cases. Those broader cases remain **Untested**;
the original top-level HTTP remote-origin failure passed the native regression test.

Sources: [release](https://github.com/manaflow-ai/cmux/releases/tag/v0.65.1),
[browser fix](https://github.com/manaflow-ai/cmux/pull/18956),
[cleanup fix](https://github.com/manaflow-ai/cmux/pull/19808).
