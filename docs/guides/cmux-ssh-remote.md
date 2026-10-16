# Native cmux SSH Remote Runbook

Status: Primary Mac-to-homelab workflow; cmux-tui API delivery validated
Last updated: 2026-10-15

## Daily Use

From a local terminal inside native cmux:

```bash
cmux ssh homelab
```

In the remote shell:

```bash
cd ~/pi_harness_setup
pi --name "homelab main"
```

`homelab` is the owner's private SSH alias, not a portable default. Optional
`--name` labels the new workspace; `--no-focus` opens it in the background.
Each invocation creates new work, not an attachment to a workspace by title.
Do not launch duplicate Pi writers when reconnecting to existing work.

## Current Ownership Model

Since cmux 0.65.0, managed persistent SSH uses cmux-tui rather than the legacy
cmuxd-remote path:

```text
Linux: shell/Pi -> cmux-tui session socket -> durable resources and notifications
                                                |
                                      authenticated SSH link
                                                |
Mac: native workspace <- resource projection / notification synchronization
     native WebKit browser -> cmux-managed HTTP forward -> Linux loopback server
```

The session **owner** keeps the PTYs and shared resource tree alive. The Mac is
a **projection**: a native view of those resources, not the process owner. The
installed helper and running owner can be different builds; replacing the file
does not upgrade the process. Preserve old owners until their work is accounted
for. An old owner is not the same component as an old CLI reverse relay.

All workspaces under one Linux account share its filesystem and account
permissions. Workspace names and IDs are routing identities, not security
sandboxes.

## Which CLI To Use

| Caller | CLI and target | Purpose |
| --- | --- | --- |
| Local Mac cmux terminal | Native `cmux` CLI | Mac UI, browser inspection, native workspace control |
| Linux native SSH session | `~/.local/bin/cmux-tui --socket "$CMUX_TUI_SOCKET"` | Linux session resources; Mac projects supported changes |
| Old legacy SSH context | `~/.cmux/bin/cmux` / cmuxd-remote | Separate authenticated reverse relay; not the new API |

`CMUX_MUX_SOCKET` is the older fallback name for `CMUX_TUI_SOCKET`.
`CMUX_TUI_TERMINAL_ID` identifies the calling Linux terminal. Never substitute
the Mac socket, select a default session blindly, or alias the two CLIs.
A missing `cmux` on Linux PATH does not imply missing cmux-tui support.

Read-only preflight from inside the remote session:

```bash
set -eu
C="$HOME/.local/bin/cmux-tui"
S="${CMUX_TUI_SOCKET:-${CMUX_MUX_SOCKET:-}}"
[ -x "$C" ]
[ -n "$S" ]
[ -S "$S" ]
"$C" --socket "$S" --json session current ping
```

A failed preflight is a stop condition, not permission to create another owner.
A fresh plain SSH shell may lack these variables; do not guess its target.

## Open A Remote HTML Artifact

Use the shared [artifact-delivery recipe](../../skills/teach/references/artifact-delivery.md),
also installed at `~/.agents/skills/teach/references/artifact-delivery.md`.
It verifies the session, finds a unique pane containing the parent terminal,
serves a dedicated directory on Linux loopback with a deadline, and runs:

```bash
"$C" --socket "$S" --json pane "$PANE" tab create browser --url "$URL"
```

`PANE` must come from the recipe's identity check; `URL` is a top-level HTTP URL
for the remote loopback server. Keep the receipt's Linux tab ID. Native handles
may change during reconciliation; re-query instead of creating another tab.

The Mac renders the native WebKit pane locally and forwards HTTP to Linux.
Linux's TUI/browser-frame renderer is separate: its `starting` status does not
prove native Mac rendering failed. Conversely, a creation receipt alone does
not prove native rendering succeeded. Verify the unique artifact marker.

Do not run `cmux browser open` through the stale Linux legacy wrapper. Do not
open remote `file://` URLs on the Mac. Ordinary Mac browsers interpret localhost
as the Mac; label the HTTP URL **cmux remote workspace only**. For files already
on the Mac, use native `cmux browser open file:///...` without an HTTP server.

Validated scope: self-contained top-level loopback HTTP. SSH-host HTTPS and
absolute localhost subresources/WebSockets remain outside this recipe. Public
pages may navigate locally on the Mac; successful public browsing does not
prove Linux network egress or full remote-origin isolation.

## Notifications

From the Linux session, using the preflight above:

```bash
"$C" --socket "$S" --json notification create \
  --terminal "$CMUX_TUI_TERMINAL_ID" --title 'Pi' --body 'Needs attention'
```

The Mac synchronizes the Linux ledger into the native Feed/sidebar. Clearing
notifications for a terminal also withdraws their native records; it clears all
rows for that target, not just the latest test. Automatic Pi hooks/resume remain
separate and are not established by this manual notification test.

## Resolve The Exact Mac Workspace

On the Mac, query `cmux --json ssh-session-list --all-workspaces` and require a
unique match on the Linux `session_id` and `backend == "cmux-tui"`. That row has
**`workspace_ref`**, not `workspace_id`. Match it against `ref` from
`cmux --json workspace list` to obtain the native UUID; confirm
`remote.remote_workspace_id` against the Linux workspace ID. Never match only
titles. Linux `ws_…`/`term_…` IDs are not Mac UUIDs.

Use native pane/surface queries with that explicit workspace. Native browser
inspection remains Mac-side; Linux session authority is not unrestricted Mac
browser automation authority.

## Persistence And Cleanup

- SSH loss/reconnect can leave the owner and remote processes running.
  Same-PID reconnect was validated on 0.64.22. On October 16, **0.65.2** also
  preserved the probe PID and in-memory nonce across explicit native workspace
  disconnect/reconnect. Unexpected carrier loss and app restart are different
  tests; do not infer them from this check or a fresh connection.
- A tab/pane/workspace **view** close is not equivalent to killing its PTY.
  Use an exact `terminal <id> close` only when intentionally ending that process;
  normal shell exit also ends it. Do not carry forward legacy teardown assumptions.
- A host reboot ends unsupervised processes. Durable layout is not process memory.
- Full app quit/relaunch and sleep/wake recovery remain **Untested** in this
  harness's current acceptance, even where upstream promises support.
- Closing an artifact tab does not stop its HTTP server. Stop the recorded task
  or let its finite deadline expire.
- cmux 0.65.1 may retain a browser forward after tab/workspace close. Cleanup may
  stop only the exact verified test forward, never shared carriers or broad
  process-name matches. App-exit forward cleanup was not exercised here.

Keep the legacy wrapper/relay metadata untouched while old work may need it.
A refused stale TCP port is not an authentication failure; loosening permissions
or forwarding the raw Mac socket is not a repair.

## Fallback

For existing tmux work only:

```bash
cmux ssh-tmux homelab
ssh -t homelab 'tmux attach-session -t pi-main'
```

Do not promote a second standalone TUI controller. Using the cmux-tui **CLI API**
for the native app's existing owner is not running a nested TUI or reviving the
rejected August pilot.

## Evidence And History

- 0.65.0 shipped the persistent SSH owner/projection migration; 0.65.1 added
  browser-loading/HTTP forwarding and app-exit forward-cleanup fixes.
- 2026-10-15: Linux-origin browser creation, native rendering versus a Mac decoy,
  origin-loss behavior, notification delivery/clear, and scoped cleanup passed
  without restarting the preserved owner.
- [0.65.1 acceptance record](../operations/cmux-upgrade-0.65.1.md) and
  [October 16 0.65.2/helper cutover](../history/2026-10-16-cmux-maintenance.md).
  The latter verified fresh SSH/Pi startup, session-API notifications, explicit
  same-process reconnect, shared-browser viewing/input, and manually prepared
  native HTTP origin/decoy/origin-loss checks with scoped cleanup. The separate
  [automated upgrade runner](../operations/cmux-upgrade.md) was attempted and
  failed; those receipts are not replaced by manual evidence. Keep it away from
  active work pending its surface-ownership/readiness/cleanup follow-up.
- [ADR 0013](../decisions/0013-adopt-native-cmux-ssh-as-primary-homelab-control-plane.md)
  preserves the primary native-SSH choice; its August backend details are historical.
- [August pilot](../history/2026-08-27-native-cmux-ssh-pilot.md) records validation
  against 0.64.22, not the current backend.
