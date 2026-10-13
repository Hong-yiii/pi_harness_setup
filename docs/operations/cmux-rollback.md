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
