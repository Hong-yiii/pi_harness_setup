# cmux 0.64.25 Rollback

Status: Historical rollback executed on 2026-10-09; superseded by the
[0.65.1 upgrade](cmux-upgrade-0.65.1.md) on 2026-10-14. The planned 0.64.25
native-browser acceptance below was not completed in this record.

## Completed

- User confirmed affected local and remote work was checkpointed.
- Controller ancestry verified under iTerm2; ordinary SSH to `homelab` passed.
- Quit cmux normally; verified the app process exited before backing up state.
- Privately backed up the 0.65.0 app, exported preferences, cmux application
  support and WebKit state, cmux runtime/session directories, and terminal config.
  Runtime sockets were excluded. Retained the original app separately as well.
- Installed official cmux **0.64.25 (106), commit `b685a275c`**.
- DMG SHA-256: `0afb2f8ff9bfef10f03e61ff12e65ce02dbca5c96cb9047118e13483ac5b08ad`.
- Strict signature verification and Gatekeeper assessment passed: Manaflow, Inc.
  (`7WLXT3NR37`), notarized Developer ID.
- Bundled Linux amd64 manifest matches the staged remote helper:
  `af7cc67db90baf37d67033c1293dfef66799bb377e5dba943a69e029ae20b5fb`.
- Disabled `SUEnableAutomaticChecks` and `SUAutomaticallyUpdate` in the cmux
  preference domain to retain the pin. This was a manual DMG install; no cmux
  Homebrew cask receipt was found at the standard local cask path.
- Launched with the one-launch environment variable
  `CMUX_DISABLE_SESSION_RESTORE=1`, avoiding automatic restoration of the newer
  session layout. Existing Linux cmux-tui owners/helpers were not stopped.

Official release: <https://github.com/manaflow-ai/cmux/releases/tag/v0.64.25>.

## Private Recovery Material

Local backup root:

```text
~/.config/pi_harness_setup/backups/cmux-mac-rollback-<date>-<private-run-id>/
```

`pre-cutover/` holds the copied app, exported preferences, state tree and backup
receipt; `cmux-0.65.0-original.app` retains the original app. `linux-handoff.md`
records Linux staging and its recovery pointers. Keep these private: they contain
session/application state, not portable configuration.

To reverse the rollback, operate from an independent terminal, checkpoint any
new work, quit cmux normally, and preserve the post-cutover app/state separately.
Restore the original app and review restoration of the matching pre-cutover
preferences/state as one consistent set. Do not merge newer/older state blindly,
copy runtime sockets, or overwrite live sessions. Recovery is not yet rehearsed.

## Historical Acceptance Plan — Not Current Instructions

The following was the remaining gate after rollback, not an instruction to
reinstall or switch back from 0.65.1. The `cmuxOnly` policy stayed intact;
acceptance required a local terminal inside cmux:

1. Create a fresh `cmux ssh homelab` workspace and verify it actually runs the
   staged `cmuxd-remote 0.64.25`, rather than assuming old PTYs migrated.
2. Verify terminal input/output, native browser Linux origin against a same-port
   Mac decoy, fresh uncached requests, origin-loss behavior, and notifications.
3. Give test fixtures independent deadlines; clean up only owned test resources.
4. Update the Linux host registry and this runbook with observed activation and
   results. Do not modify unrelated Linux repository changes.
5. Preserve the old cmux-tui owner until all dependent sessions are accounted for
   and its retirement is separately approved.

Native browser repair on **0.64.25** remains **Untested** in this record. Do not weaken
any cmux-tui-only acceptance runner to obtain a passing legacy result. App
installation and helper staging alone do not establish successful rollback.

## Historical Linux Preparation — 2026-10-08

The following preserves the pre-cutover snapshot and plan, not current operating
instructions. Mac installation subsequently completed as recorded above; the
October 14 upgrade supersedes this rollback. Process/workspace descriptions and
pending steps below refer only to October 8.

### Why this is not a Linux binary replacement

The 0.65 managed-SSH backend uses `cmux-tui`; the legacy backend uses
`cmuxd-remote`. They are not interchangeable binaries or a demonstrated live-PTY
migration path. Replacing `cmux-tui` with an older Go helper would break the
current client without transferring its running terminals.

On this host, the detached Rust owner currently has four workspaces, including
the Pi session performing this preparation. Its executable inode is deleted,
although the on-disk binary has the same hash/build. Both executable images were
preserved in a protected backup. No daemon, workspace, relay, socket, shell
configuration, or running executable was changed or stopped.

### Prepared Linux state

- Existing `0.64.22` helper retained unchanged; it was validated in the earlier
  native SSH pilot.
- Official `0.64.25` Linux amd64 helper staged at
  `~/.cmux/bin/cmuxd-remote/0.64.25/linux-amd64/cmuxd-remote`.
- SHA-256: `af7cc67db90baf37d67033c1293dfef66799bb377e5dba943a69e029ae20b5fb`.
- Release API digest, downloaded checksum list and release manifest agree.
  `cmuxd-remote version` returns `0.64.25`. The native bootstrap's one-shot
  `serve --stdio` hello handshake passed and exited 0 on EOF under a five-second
  deadline; no persistent legacy daemon, PTY or listener was started.
- Protected recovery evidence and local-agent handoff:
  `~/.config/pi_harness_setup/backups/20261008T143017Z-cmux-rollback-lfmwkvn2/`.
  `receipt.json` records paths/hashes and PID start identities, not terminal
  contents or authentication data. `verify-staging.py` is a read-only check
  **before** cutover; it is expected to fail once the old session is ended.

This proves artifact integrity and preservation, **not working browser routing**.
`0.64.25` is the issue reporter's last-working version, not yet locally accepted.

### Original Mac agent cutover plan

1. Operate from an independent local terminal, not the cmux process being quit.
   Coordinate with the owner: finish/checkpoint all four remote workspaces and
   any local work; record each agent's own resume path. Do not start a second Pi
   process writing the same session file while its original process is alive.
2. Stage the exact official `v0.64.25` DMG. Verify its release digest, app version,
   signing identity/notarization, and bundled Linux-helper manifest against the
   staged Linux hash. Stop on mismatch; do not bypass Gatekeeper or verification.
3. Preserve the existing app, preferences and relevant application/session state
   privately. Make state backups consistent after a controlled app quit. Record
   the install method and recovery procedure; an older app may not understand
   newer saved state. Do not blindly delete or overwrite state to make it launch.
4. Install the pinned app, not `brew upgrade` or the current latest cask. Track
   any manual-install/Homebrew receipt mismatch and cmux's auto-update policy.
   Do not alter unrelated package managers or global update settings.
5. Open a **fresh** `cmux ssh homelab` test workspace. Confirm the old app selects
   the matching `0.64.25` helper and legacy backend. Do not assume restored
   0.65 workspaces adopt the old helper or that old PTYs transfer automatically.
6. Verify actual remote terminal input/output, native browser routing to a
   synthetic Linux-only marker with a same-port Mac decoy, origin-loss behavior,
   and notifications. Use explicit owned test surfaces, deadlines and cleanup.
   A curl response, manually forwarded browser, or app version alone is not
   acceptance. Run fixtures only with their bounded lifecycle registered as
   required by the host handbook.
7. The current `cmux-browser-routing-v1` runner expects `backend=cmux-tui` and
   will block on the legacy backend. Do **not** remove that guard just to get
   green. Report separate version-appropriate native evidence, or obtain review
   for a legacy-compatible verifier before claiming automated acceptance.
8. Only after success, resume checkpointed work in fresh legacy-owned terminals.
   Leave the old Rust owner/state until every dependent workspace is accounted
   for and retirement is deliberately authorized. Update this runbook and the
   host service registry with the actual running versions and test outcomes.

### Original staging recovery plan

Before activation, removing only the newly staged helper and its empty version
directories undoes staging. First verify the recorded hash and that no process
uses that executable. Do not remove `0.64.22`, `cmux-tui`, runtime state or backups.

If Mac cutover fails, stop and use the preserved app plus a reviewed compatible
state recovery path. Do not overwrite live state while either version runs.
Binary backups do not resurrect processes or prove state-format compatibility.
Never signal a historical PID without rechecking executable and start identity.

Sources: [official release](https://github.com/manaflow-ai/cmux/releases/tag/v0.64.25),
[reported regression](https://github.com/manaflow-ai/cmux/issues/18249),
[legacy helper command dispatch](https://github.com/manaflow-ai/cmux/blob/v0.64.25/daemon/remote/cmd/cmuxd-remote/main.go),
and [prior native SSH decision](../decisions/0013-adopt-native-cmux-ssh-as-primary-homelab-control-plane.md).
