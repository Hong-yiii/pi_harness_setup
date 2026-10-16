# cmux Maintenance and Shared-Browser Publication — 2026-10-16

Status: **Mac 0.65.2 and its manifest-matched Linux helper installed**; targeted
manual checks passed. The automated native routing runner did **not** pass and
must not be presented as upgrade approval. Shared-browser publication has its
own source, loader and native-service evidence.

## Authorization and Initial Blocker

The owner runs the controller in iTerm and explicitly permits ending cmux
sessions on both hosts for maintenance. Controller ancestry confirmed iTerm,
independent of the native app. Credentials, profiles, private session history,
unrelated processes and the homelab checkout's local test edit remain protected.

At approximately **02:03 UTC**:

- Mac was **0.65.1 (110), `8a853dcc9`**, signed by Manaflow, Inc., team
  `7WLXT3NR37`.
- The installed Linux helper was `5f39d4fc6dcbe25ce117bb476e939b6c23959109`,
  matching that app's manifest, SHA-256
  `11bcbec237b1ce8b80337e171c74961fbf9cdc59377746470bdefcd04128c9cb`.
  Older running processes still used a deleted executable with hash
  `871cdf8e6f15155e6e255890f9f7675b0a3c693282843cca557afd5d32a2cb1a`.
- [GitHub's release API](https://api.github.com/repos/manaflow-ai/cmux/releases/tags/v0.65.2)
  announced 0.65.2, published at 00:55:40 UTC, but returned `assets: []`.
  The [stable appcast](https://files.cmux.com/stable/appcast.xml) advertised build
  111; its exact arm64 DMG and the checked appcast downloads returned HTTP 404.
- A normal AppleScript quit returned **`User canceled` (-128)**. No force or
  owner termination followed at that point. The app/helper pair stayed unchanged.

These are time-specific observations, not the final deployment outcome.

## Verified Cutover After Publication

At the **08:38 UTC** recheck, official artifacts were available and the owner
renewed the request to finish both hosts and submit a PR against `main`.

| Artifact | Verified identity |
| --- | --- |
| [Official arm64 DMG](https://github.com/manaflow-ai/cmux/releases/download/v0.65.2/cmux-macos-arm64.dmg) | SHA-256 `281f20bc0caf5dc8d0f8d683145992972abc886ddc954545c400ea1854af928d` |
| Native Mac app | **0.65.2 (111), `9d01f956c`**; `com.cmuxterm.app`; strict deep signature verification; Manaflow team `7WLXT3NR37`; Gatekeeper accepted **Notarized Developer ID** |
| Signed candidate's helper manifest | `a9b104f3cb7d3808cf7eb5ae08b4819333b25870` |
| [Linux x86_64 musl helper](https://files.cmux.com/cmux-tui/a9b104f3cb7d3808cf7eb5ae08b4819333b25870/cmux-tui-x86_64-unknown-linux-musl) | SHA-256 `c310ed196e9db24349d235377b006382f4e30ec69b6e00c7e87b41fc79652500` |
| Helper runtime | `cmux 0.1.0 (a9b104f3cb7d3808cf7eb5ae08b4819333b25870; ghostty cb1ef7091cdef0b581ee2cbd83742b653253523e)` |

Private recovery copies on each host are under
`~/.config/pi_harness_setup/backups/cmux-0.65.2-upgrade-20261016T083838Z/`.
Mac copies include the old app, preferences and relevant application/WebKit state;
Linux copies include the previous helper and cmux state. These are host-local,
not synchronized credentials or versioned artifacts. They do not promise recovery
of terminated in-memory PTYs or compatibility of newer state with older binaries.

After renewed maintenance authorization, the verified old Mac process received
SIGTERM. **23 positively identified old Linux cmux processes** were terminated
using PID-bound descriptors and executable hashes, not broad name matching. The
Linux helper and Mac app were replaced with staged copies; the new app was
launched with session restoration disabled for this maintenance run. The installed
signature/version and actual running Mac process were checked. All observed live
`~/.local/bin/cmux-tui` executable hashes matched the new manifest-selected helper, rather
than merely checking the file on disk. No tmux or unrelated agents were targeted.

## Native Evidence and the Failed Automated Gate

Native commands ran through an explicitly created local cmux terminal using
AppleScript targeting; the iTerm controller remained independent. `cmuxOnly`
was not relaxed.

The unchanged `cmux-browser-routing-v1` runner was attempted on both releases:

- **0.65.1 baseline:** preflight/fixtures passed; local navigation timed out;
  one remote request reported `stale_state`; localhost and origin-loss checks
  passed, but browser cleanup could not be verified. Overall **FAIL**.
- **0.65.2 post-install:** preflight passed; created surface ownership could not
  be verified, leaving fixtures blocked and cleanup failed. Overall **FAIL**.
- Subsequent disposable SSH workspaces reported
  `transport closed: invalid resource response`. Closing the **recorded,
  test-created Linux workspace** from that failed fixture run restored
  connectivity; no private profile/state tree was reset. This is an observed
  recovery sequence, **not a source-proven root cause** or a general reset recipe.

Retain both private receipts; no passing comparison or full automated upgrade
approval exists. Do not run this trial verifier against active work or treat a
new native surface handle as stable across SSH projection reconciliation.

Separate manual checks on **0.65.2** passed:

- Fresh native SSH workspace creation, executed terminal output, interactive
  Node **24.20.0** and Pi **1.2.0** startup without a model request.
- Manual native HTTP routing passed the Mac browser control, Linux-origin IPv4
  and `localhost` checks against a same-port Mac decoy, and fail-closed origin
  loss. It used the unchanged page/origin-loss oracle functions, but **different
  setup**: Linux resource placement/receipt, fresh projected native handles and
  explicit focus of the disposable browser. Preparatory probes exposed targeting
  and readiness assumptions; the final run also verified owned native/Linux
  workspaces absent after cleanup. This is **not** a passing v1 runner receipt.
- A Linux session-API notification appeared in the native Mac notification list;
  clearing only that disposable terminal's notifications removed it.
- Explicit workspace disconnect/reconnect preserved the Linux probe's **PID and
  in-memory nonce**, and accepted a reply after reconnect. This does not prove
  unexpected carrier-loss, app-restart or sleep/wake continuity.
- The published browser client authenticated its native cmux viewer. VNC keyboard
  input navigated the **same Linux Chrome tab** subsequently read by Playwright.
- Linux Chrome rendered public HTTPS IANA example-domain content; independent
  Linux curl returned HTTP 200 with TLS verification successful. The first
  private probe assumed an obsolete heading; its captured live page contained
  IANA's revised text. The corrected external-content check passed without any
  change to the native routing oracle.
- Client shutdown released control while the browser remained ready in human
  mode. Explicit stop then stopped the service; no boot autostart was enabled.

These checks do not erase the failed automated receipts. Broader lifecycle,
automatic Pi notification hooks, mobile use and long-duration/capacity behavior
remain **Untested**. Private receipts and temporary acceptance programs are not
part of the PR.

## Shared Setup and PR Scope

The reviewed browser service was republished as release **`61055e777105cd44`**;
installed CLI/protocol/service source equality, systemd verification and the full
native service smoke passed. This supersedes initial service release
`b224d30a153851cf`; see [the browser operation](../operations/shared-browser.md).

Final shared-source validation on this pass:

- Mac: **56 passed, two expected skips**.
- Linux: **58 passed, no skips**.
- Both hosts: apply/check and real no-model Pi resource loading passed, including
  one `/browser` command, one `shared_browser` tool and both browser skills.
- Final browser unit: **inactive, `MainPID=0`, `UnitFileState=static`**. The
  disposable native test window/workspaces were removed, the DMG was detached,
  and `cmuxOnly` still rejected the independent iTerm controller.
- The dirty Linux checkout remained at
  `c8bedbcffb5a804c1f72cb2159a9a39d21a049d7`; its existing test-edit diff hash
  remained `864bc533b10eac6025b4f52df2d06be853241430e10f6e84031c7eb64e386c32`.
  Deployment used an isolated source snapshot, not that checkout.

The PR includes the service, thin extension, skills, publication/drift tests,
CI syntax coverage and these evidence boundaries. It does not include private
backups, profiles, sockets, receipts or session logs. Opening the PR against
`main` is not automatic merge authorization.
