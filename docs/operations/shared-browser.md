# Shared Linux Browser

Status: initial service/client published and natively exercised on 2026-10-15–16.
The PR #20 review follow-up changes are source-only: host publication and native
reload/installer revalidation remain **Untested**. Decision:
[ADR 0016](../decisions/0016-use-a-service-owned-shared-browser.md).

## Ownership and Scope

- Linux `systemd --user` owns a dedicated sandboxed Chrome, Xvfb, x11vnc,
  websockify/noVNC, and private Unix control socket.
- Pi's repository-owned extension provides `/browser` and `shared_browser`.
  Closing/reloading Pi releases its automation lease and viewer tunnel, **not**
  the browser service. SSH failure likewise does not destroy the browser.
- Mac cmux hosts a local noVNC viewer. It shows the **same Linux Chrome** that
  Playwright controls; it is not a second browser session or website DOM proxy.
- `pi-web-access` remains the research/search owner. `cmux-browser` is the native
  Mac WKWebView skill; `shared-browser` is the Linux browser skill.
- This is an on-demand service: no boot enablement or automatic crash restart.
  The unit stops after eight hours, including idle time. Profiles persist.

Reference host: Ubuntu 24.04 x86_64, working user systemd, managed Node 24.20.0,
existing Google Chrome and `xauth`. This installer is **not** a generic Linux or
container installer. The Mac viewer was validated on cmux 0.65.1 and targeted
checks passed on 0.65.2; other builds need compatibility validation. A previously
reviewed SSH alias is required.
No sudo, Docker/Podman, or Chrome `--no-sandbox` is used.

## Install / Publish

Review `docs/current-plan.md` before installation. On the Linux host, from a
complete trusted checkout or isolated source snapshot:

```bash
export PATH="$HOME/.local/bin:$PATH"
bash scripts/browser-service/install.sh
node scripts/apply-pi-setup.mjs --assets-only
node scripts/apply-pi-setup.mjs --check
```

The installer refuses an active service and existing destination symlinks where
unsafe, stages and validates dependencies before publishing them, retains the
old service/current-release link in a dated backup, and never starts/enables the
unit. It extracts user-scoped Ubuntu packages instead of modifying apt's system
installation. `scripts/browser-service/dependencies.sh` owns extraction and
validation; no trial scripts are needed. Missing/non-executable binaries, failed
`ldd` inspection and unresolved libraries fail before dependency publication.
These copies **do not receive automatic apt security updates**; refresh them
deliberately during a reviewed maintenance pass.

On Mac, publish the portable extension and skills with the same apply/check
commands. Create `~/.config/pi-browser/client.json`, mode `0600` in a private
`0700` directory, with your reviewed SSH alias, for example:

```json
{"sshHost":"homelab"}
```

This is host-local configuration, not a tracked harness asset. Review the
alias's destination, identity and forwarding configuration; use an alias with
no unrelated forwards. Host keys must already be trusted. Linux uses its local
CLI and needs no alias configuration.

Apply needs `pi/`, `skills/`, `scripts/`, and `terminal/zsh/piwt.zsh` from the same
source revision. A Git pull alone does not publish resources. Preserve a dirty
remote checkout by using an isolated snapshot rather than overwriting it.
Reload Pi or start a fresh session after publication. Registration alone neither
reads browser configuration nor launches children, sockets, timers or browsers.

## Daily Use

In the Pi session that will control the browser:

```text
/browser start
/browser connect
/browser view
```

`start` can take roughly 30 seconds on the reference host: accepting a CDP
connection precedes Chrome's first successful HTTP load. Startup now proves a
local HTTP navigation before advertising readiness; it does not contact an
external website for this check.

`connect` grants only this Pi session a 15-minute automation lease, refreshed by
browser operations. No automatic claim or lease stealing occurs. `view` opens a
local browser-only cmux workspace without taking focus; switch to **Shared
browser** to interact. On Linux, `view` explains the Mac viewing path rather than
silently opening another browser. With the normal `cmuxOnly` socket policy,
run `/browser view` from a **local Pi terminal inside cmux**, not iTerm or a
managed SSH terminal. Browser automation over SSH can still run from iTerm;
viewer creation must not bypass the native socket policy.

`view` checks connection readiness for new and reused viewers, including a
same-URL page reload. Credentials are submitted at most once per invocation;
clicking the password button alone is not success. The readiness probe uses the
default noVNC UI's `noVNC_connected` class, checked in upstream
[v1.3.0](https://github.com/novnc/noVNC/blob/v1.3.0/app/ui.js) and
[v1.6.0](https://github.com/novnc/noVNC/blob/v1.6.0/app/ui.js), not a stable public
DOM API. Revalidate it when updating extracted noVNC packages.

Ask Pi to use `shared_browser`: list tabs, open/navigate an HTTP(S) URL, inspect
visible DOM text, click/fill/press, take a PNG screenshot, or close an explicitly
named tab. Every existing-tab action requires a generation-scoped tab ID; restart
invalidates old IDs. Arbitrary JavaScript, cookie APIs and raw CDP are not tools.
Page content is untrusted; keep external purchases, submissions, credentials and
destructive actions behind the normal user-approval boundary.

| Command | Effect |
| --- | --- |
| `/browser status` | Report service and controller mode; no claim/start |
| `/browser handoff` | Release automation for human input; retain viewer |
| `/browser connect` | Explicitly regain automation when available |
| `/browser view` | Open/reuse this client's viewer, or reconnect after tunnel loss |
| `/browser disconnect` | Release control and stop this client's viewer tunnel |
| `/browser stop` | Confirm in interactive Pi, then stop the shared service for everyone |

Human input is not mechanically locked out by the automation lease. Use
`handoff` before touching Chrome and `connect` after handing it back. Another
controller gets `BROWSER_BUSY`; expiry/shutdown/release makes the lease available.
A cancelled or timed-out mutation may already have executed remotely: inspect
state before retrying it. The viewer workspace is left intact on disconnect so
Pi cannot accidentally destroy a pane the human repurposed.

The parent Pi session owns browser consent. Publishing a skill does not expand
read-only subagent tool allowlists or transfer a lease to children. Custom child
roles do not inherit every skill automatically; pass selected skills explicitly
when relevant, and keep browser actions in the authorized interactive session.

## Security and Private State

- Browser listeners bind only to loopback; the service checks both IPv4 and IPv6
  listeners. SSH forwards only the viewer in this implementation, never CDP.
- VNC requires a fresh random password. The client transfers it through private
  service stdin/socket traffic and native cmux socket RPC, never shell arguments,
  viewer URLs, tool output or client logs. It validates its exact viewer URL and
  actual noVNC credential-request dialog before injection, and clears the form
  afterwards. Layout rectangles alone are not proof that the form is ready.
- Same-UID processes on either trusted host remain in the trust boundary. This is
  not multi-user isolation, a browser-content sandbox for the entire harness, or
  protection against an agent already authorized to run arbitrary shell commands.
- Screenshots and DOM text are intentional model-visible data. Do not inspect
  unrelated authenticated tabs or expose passwords/session data as debugging.

Private paths (never copy into Git or between hosts):

| Path | Purpose |
| --- | --- |
| `~/.local/share/pi-browser/profile/` | Dedicated persistent Chrome profile |
| `~/.local/share/pi-browser/dependencies/` | Extracted user-scoped dependencies |
| `~/.local/share/pi-browser/releases/` and `current` | Versioned service implementation |
| `~/.local/share/pi-browser/backups/` | Installer rollback metadata |
| `~/.local/state/pi-browser/` | Private control socket, display auth, VNC secret, component logs |
| `~/.config/systemd/user/pi-browser.service` | User unit; no enablement target |
| `~/.config/pi-browser/client.json` | Mac SSH alias only |

`KillMode=control-group` cleans descendants after normal stop or controller death;
`Restart=no`, `RuntimeMaxSec=8h`, `MemoryMax=1536M`, and `TasksMax=256` bound the
service. The memory/task caps are reference-host defaults, not measured capacity
for arbitrarily heavy sites. Browser crashes require explicit restart.

## Validation and Recovery

Source-only checks:

```bash
node --test tests/shared-browser-service.test.mjs tests/shared-browser-extension.test.mjs tests/apply-pi-setup.test.mjs
```

On Linux, **with the service stopped and no active human browser work**:

```bash
node scripts/browser-service/smoke.mjs
```

This intentionally starts/stops/kills only the dedicated service. It verifies
refused-file preservation, same-page DOM actions and PNG, controller handoff and
lease enforcement, Chrome's reported adequate sandbox, crash cgroup cleanup,
explicit restart, stale-tab rejection and graceful stop. It leaves the service
stopped. Do not run it against someone else's active browser.

For runtime diagnosis use `systemctl --user status pi-browser.service` and
`journalctl --user -u pi-browser.service`. Inspect component logs locally only
when necessary; do not paste private browser data or `vnc-password` into a chat.
After SSH loss, run `/browser status`, then `/browser view`; do not start a second
browser or kill Chrome by name. After a crash, use `/browser start` and fetch fresh
tab IDs. Never use broad `pkill`, delete an unknown control-path file, or clear the
profile as a connectivity fix.

Rollback: disconnect clients and explicitly stop the service, restore the
previous `current` link and unit from the installer-reported backup, then run
`systemctl --user daemon-reload`. Retain the dedicated profile and dependencies.
To remove the client, back up/move `~/.pi/agent/extensions/shared-browser` outside
Pi discovery on **both hosts**, restore the prior reviewed profile/apply source,
then reload Pi. Do not delete profiles, credentials or unrelated extensions.

## Evidence / Limits

- The [October 16 maintenance record](../history/2026-10-16-cmux-maintenance.md)
  records deployed release **`61055e777105cd44`**, native service smoke, both-host
  publication/loaders and manual viewer/input/lifetime checks. These precede the
  source-only review follow-up; they do not validate its reload behavior or new
  dependency helper. The separate automated cmux routing gate **failed**.
- Isolated source regressions exercise same-URL reload, connected reuse, rejected
  authentication, bounded submission, navigation races and dependency inspection.
  They use synthetic DOM/process fixtures, not a live cmux/noVNC installation.
- Earlier idle measurements belong to the [superseded trial](../history/2026-10-15-linux-browser-trial.md),
  not a service capacity benchmark. Mac overhead, bandwidth, heavy-site capacity,
  long-duration stability, host reboot/suspend and mobile remain **Untested**.
