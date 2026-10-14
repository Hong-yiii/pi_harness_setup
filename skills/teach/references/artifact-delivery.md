# Deliver an HTML artifact through cmux

Use this recipe for presentation only; it does not invoke teach mode. Keep the
artifact in a dedicated temporary directory, outside the project and credentials.

## Choose by execution context, not by `cmux` on PATH

- **Local Mac:** use the native CLI: `cmux browser open 'file:///absolute/path.html'`.
  No HTTP server or tunnel is needed. Quote/URL-encode the path.
- **Linux in native cmux SSH:** use the session's **cmux-tui API** below. The
  Mac renders the browser; `file://` would read the Mac filesystem, not Linux.
  A missing `cmux` command does not mean this integration is unavailable.
- **Missing session identity or failed preflight:** stop automatic delivery.
  Keep the artifact and report the failure. Ask the Mac controller to resolve
  the exact terminal/workspace, or copy only the artifact privately to the Mac
  and open that local copy. Do not guess from a workspace title or use an
  unrelated active workspace. A remote `file://` link is not a delivered artifact.

Do not revive `~/.cmux/bin/cmux`, use `~/.cmux/socket_addr`, alias the two CLIs,
change socket permissions, forward the Mac control socket, or restart owners.
The legacy CLI and cmux-tui speak different control protocols.

## Linux preflight and target resolution

Run inside the parent agent's remote session, not a fresh plain SSH shell.
Use the inherited socket and terminal identity; do not hardcode a username,
`/run/user/1000`, session name, or a previous run's IDs.

```bash
set -eu
C="$HOME/.local/bin/cmux-tui"
S="${CMUX_TUI_SOCKET:-${CMUX_MUX_SOCKET:-}}"
: "${CMUX_TUI_TERMINAL_ID:?No owning cmux-tui terminal; stop}"
[ -x "$C" ]
[ -n "$S" ]
[ -S "$S" ]
"$C" --socket "$S" --json session current ping
PANE="$(
  "$C" --socket "$S" --json tab list |
  python3 -c '
import json, os, sys
rows = [r for r in json.load(sys.stdin)
        if r.get("content_kind") == "terminal"
        and r.get("content_id") == os.environ["CMUX_TUI_TERMINAL_ID"]]
if len(rows) != 1 or not rows[0].get("pane_id"):
    raise SystemExit("No unique terminal placement; stop without changes")
print(rows[0]["pane_id"])
'
)"
printf 'Owning Linux pane: %s\n' "$PANE"
```

The unique-placement check intentionally refuses a terminal projected into
multiple panes. A user must choose the intended placement in that case.
Tool calls may use separate shells: rerun this block with the open command in
one shell, or explicitly carry the verified variables; do not assume shell
variables persist between tool calls.

## Serve and create one browser tab

1. Serve **only** the presentation directory, containing no unrelated files or
   symlinks, on Linux loopback:
   `python3 -m http.server <port> --bind 127.0.0.1 --directory <presentation-dir>`.
   Prefer `bg_run`, `isAgent: false`, `timeoutSeconds: 7200`; otherwise use
   `timeout 2h ...` and record its PID. Use a free high port; never kill or reuse
   an unknown listener. Retain the task ID, directory, port, and deadline.
2. Confirm the task is running and an HTTP read returns the artifact's unique
   title/marker. A port accepting connections is not enough.
3. With the preflight variables above, create **one tab in the owning pane**:

   ```bash
   URL='http://127.0.0.1:<port>/<encoded-file-name>.html'
   "$C" --socket "$S" --json pane "$PANE" tab create browser --url "$URL"
   ```

4. Save the JSON receipt's `value.tab_id`, `value.browser_id`, and
   `value.workspace_id`. This is a Linux resource receipt, not proof the Mac
   loaded it. Do not blindly retry a timed-out mutation: query the tabs first
   to avoid duplicates. A successful receipt is not a reason to create again.
5. The Mac projects the resource as a native WebKit tab. Initial reconciliation
   can replace native surface handles; resolve fresh handles for verification.
   Do not mistake the Linux browser's `starting` status for Mac render failure:
   the Linux TUI renderer and native Mac renderer are distinct.
6. Verify the unique marker in the native browser via the Mac controller, or
   ask the user to confirm it. If only API creation was observed, report
   **created; native rendering unverified**, not “opened successfully.”

Use top-level loopback **HTTP**. SSH-host HTTPS and absolute localhost
subresources/WebSockets are not covered by this recipe. Self-contained HTML
avoids those extra routing requirements. Linux browser resources do not grant
arbitrary control of the Mac's browser automation API.

## Verification, cleanup, and handoff

On the **Mac**, `cmux --json ssh-session-list --all-workspaces` maps the exact
Linux terminal (`session_id`, backend `cmux-tui`) to a native `workspace_ref`.
Require a unique match; this response does **not** contain `workspace_id`.
`cmux --json workspace list` can resolve that ref to a Mac UUID and confirm its
`remote.remote_workspace_id` matches the Linux receipt. Query that workspace's
panes/surfaces and inspect the new browser, rather than changing global focus.
For example, `cmux --json browser <fresh-native-surface> get text --selector body`
reads the rendered marker. Native refs/UUIDs and Linux opaque IDs are not
interchangeable.

When finished, close only the recorded Linux tab:

```bash
"$C" --socket "$S" --json tab '<receipt-tab-id>' close
```

Stop the recorded HTTP task/PID separately. Browser close does not stop the
server; the deadline is the crash fallback. cmux 0.65.1 may retain its own port
forward after tab/workspace close. Do not broadly kill transports: a Mac
controller may stop only a positively identified, otherwise unused test
forward. Do not promise full forward cleanup merely because the tab closed.

Reply with the artifact path, actual command/receipt, delivery status, and server
lifetime/cleanup. Label the URL **cmux remote workspace only**: opening it in an
ordinary Mac browser targets the Mac, not Linux. Never publish the server on
`0.0.0.0` or manufacture an unauthenticated reverse-control tunnel.

## Optional notification

Use the same explicit session routing and the parent terminal, not the legacy
relay:

```bash
"$C" --socket "$S" --json notification create \
  --terminal "$CMUX_TUI_TERMINAL_ID" --title 'Pi' --body 'Artifact ready'
```

The Mac synchronizes the Linux notification ledger. This is independent of Pi's
automatic lifecycle hooks. `notification clear --terminal <id>` clears **all**
notifications for that terminal; do not use it to clean up one test on a working
terminal. Test notifications in a disposable terminal instead.

## Validation boundary

Live-tested 2026-10-15: Mac 0.65.1, installed Linux helper `5f39d4…`, preserved
owner `c18c5c…`; Linux-created tab rendered the Linux marker, not a same-port Mac
decoy; origin loss failed closed; notification delivery/clear and owned-resource
cleanup passed. No owner restart was needed. Other builds/hosts require their
own bounded smoke test.
