# cmux 0.65.1 Coordinated Upgrade

Status: Mac and Linux helper updated on 2026-10-14; core native acceptance passed.
Remote CLI availability and the broader browser limitations below remain open.

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
