# Visible Linux Playwright browser trial

Status: **Superseded trial**, approved and exercised on Ubuntu 24.04 x86_64 on
2026-10-15. For normal use, follow the [shared browser service operation](shared-browser.md).
This retained trial runbook is not the service, Pi extension, MCP server, or a
cmux upgrade. Its dependency installer is reused by the reviewed service installer.

## What is shared

```text
Linux Playwright --CDP--> one sandboxed Chrome, fresh trial profile
                               |
                         Xvfb display
                               |
                  authenticated x11vnc + noVNC/websockify
                               |
                    explicit loopback SSH tunnel
                               |
                   local Mac cmux WKWebView
```

The Mac displays pixels and sends mouse/keyboard events to the **same Linux
browser**. Its native WebKit engine is only the noVNC client. Cookies, DOM,
JavaScript memory and tabs remain in Chrome on Linux; nothing is synchronized
with a Mac browser profile. Human and automation input must take turns.

Playwright is the deterministic browser-control library. A computer-use plugin
would add an agent's screenshot/click policy, not inherently remove the virtual
display or provide a human viewer. Prefer Playwright for DOM/forms/tests. Consider
computer use only for a concrete visual-only/desktop task; no plugin or model
calls were added to this trial. Existing pi-web-access remains the research owner.

## Installed scope

All additions live under `~/.local/share/pi-browser-trial` on Linux:

- Playwright **1.64.1**, with npm lockfile; no browser download or lifecycle scripts.
- Existing system **Google Chrome 152.0.7977.75**, unchanged, sandbox enabled.
- Official Ubuntu packages extracted into `sysroot/`, not installed system-wide:
  Xvfb/xserver-common `2:21.1.12-1ubuntu1.8`, x11vnc `0.9.16-10`,
  libvncserver/client `0.9.14+dfsg-1ubuntu0.2`, noVNC `1:1.3.0-2`,
  python3-websockify `0.10.0+dfsg1-5build2`, python3-numpy
  `1:1.26.4+ds-6ubuntu1`, python3-pkg-resources `68.1.2-2ubuntu1.2`.
- `packages.txt` and `debs.sha256` record actual versions/hashes. apt validates
  downloads against the configured repository index. Package candidates may
  change on a future install; review the resulting inventory. Extracted copies
  do not receive system apt upgrades automatically; review before permanent use.
- Managed Node **24.20.0**, explicitly selected through `~/.local/bin/node`.
  Plain noninteractive SSH otherwise selected system Node 18.

No sudo, Docker daemon, firewall changes, existing profile imports, autostart,
ambient agent tools, or cmux owner restarts. Each launch gets a fresh profile.
Run directories are private and retained after shutdown; if used for real sites,
they can contain sensitive browser state and must remain outside Git.

## Reproduce on this reviewed host

The installer refuses an existing trial root. Do not remove a running trial just
to rerun installation. This is Ubuntu 24.04 x86_64-specific, not a generic bootstrap.

From the repository on the Mac, for an initial install only:

```bash
ssh -T homelab 'bash -s' < scripts/browser-trial/install.sh
scp scripts/browser-trial/{trial.mjs,check-lifecycle.py} \
  homelab:.local/share/pi-browser-trial/
```

In a Linux terminal, start explicitly:

```bash
timeout --signal=TERM --kill-after=15s 3650s \
  ~/.local/bin/node ~/.local/share/pi-browser-trial/trial.mjs start
```

The ready line contains only the PID, display, viewer port and expiry. The
supervisor and each component have a one-hour deadline. Chrome uses its own
process group; shutdown terminates only trial-owned groups, including websockify
workers. An exclusive `active/` lock rejects concurrent launches. After a crash,
inspect the private `run/*/process-groups` journal and listeners before removing
a stale lock. Do not interpret an old receipt as proof of a running process.

From a separate Mac terminal, substitute the ready line's `webPort`:

```bash
ssh -N -T -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=20 -o ServerAliveCountMax=3 \
  -L 127.0.0.1:6081:127.0.0.1:REMOTE_WEB_PORT homelab
```

Open `http://127.0.0.1:6081/vnc.html?autoconnect=1&resize=scale` in a **local**
cmux workspace, not a managed SSH workspace. That avoids cmux 0.65.1's remote
localhost/WebSocket rewrite limitations. The native browser will ask for the
per-run VNC password. Its path is recorded in private `current.json` as
`passwordPath`; handle it locally, never paste it into agent chat, URLs or logs.
The initial trial authenticated it through the native socket without printing it.

noVNC says **“Connected (unencrypted)”** because its local HTTP/WebSocket leg is
not TLS. The Mac–Linux network leg is encrypted by SSH. VNC and CDP must never be
forwarded to public listeners. Classic VNC authentication uses only eight password
characters; it is supplemental to the loopback/SSH boundary, not a substitute.
CDP trusts other local users: it has no application authentication. Its private
endpoint is in `current.json`; only the viewer port is forwarded to the Mac.

## Control the existing browser

From the dedicated Linux tooling directory:

```js
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const { endpoint } = JSON.parse(await readFile('current.json', 'utf8'));
const browser = await chromium.connectOverCDP(endpoint);
try {
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  // Operate on this page; do not launch another browser or create another context.
  console.log(await page.title());
} finally {
  await browser.close(); // Disconnect this CDP client; supervisor owns Chrome.
}
```

Run the synthetic shared-page check while that page still exists:

```bash
~/.local/bin/node ~/.local/share/pi-browser-trial/trial.mjs check
```

It asserts **all three listeners** (VNC, viewer, CDP) are exactly IPv4 loopback,
then a second Playwright client reads the original marker, edits the same input,
and clicks the original button. It deliberately fails after that test page is
replaced. No real site credentials are needed for acceptance.

With no active trial, check startup cancellation and full cleanup:

```bash
python3 ~/.local/share/pi-browser-trial/check-lifecycle.py
```

The cancellation case observes an actual Xvfb process before signaling the
supervisor. Both cases inspect the final process-group journal after shutdown,
including late-recorded groups, rather than only pre-signal descendants.

## Observed acceptance and overhead

- Chrome's `chrome://sandbox` reported namespace, PID/network namespace and
  Seccomp-BPF sandboxing enabled (“You are adequately sandboxed”). Second-client
  Playwright control passed.
- Native cmux showed the actual 1280×800 Linux display over an authenticated
  noVNC WebSocket. Pointer input reached the original button; keyboard input
  through the Mac viewer appeared in the original Playwright input.
- Early-startup cancellation and full launch/check/shutdown passed. The final
  listener assertion rejects wildcard/IPv6 listeners; all three must be loopback.
- An initial audit caught x11vnc's separate `[::]` listener despite its IPv4
  `-listen` argument. That trial was immediately stopped. `-no6 -noipv6` and a
  fail-closed runtime assertion now prevent this. Only synthetic state existed;
  VNC authentication was enabled throughout. No external-access test was made.
- Initial connected, mostly idle, ten-second Linux sample: Chrome **384 MiB PSS**,
  Xvfb **36 MiB**, x11vnc **12 MiB**, websockify **32 MiB**, Node controller
  **68 MiB**: approximately **533 MiB total**. Display/VNC CPU was approximately
  **0.6% of one core** in that sample. These are workload-specific observations,
  not limits. PSS apportions shared memory; it is not summed RSS.
- Initial installed footprint including a fresh profile: **68 MiB**, reusing
  system Chrome. Additional profiles/cache grow this. No second browser download.

VNC encodes changed screen regions. Idle pages are inexpensive; animations,
scrolling, video and larger resolutions consume more CPU and bandwidth. Chrome
usually dominates RAM. Mac WKWebView rendering and SSH also cost resources;
per-pane Mac memory, sustained interactive/video bandwidth, latency, clipboard,
non-US keymaps and long-running login recovery are **Untested**. This is a live
viewer, not a GPU desktop or a guarantee of fluid video.

## Stop and rollback

In the remote foreground terminal, Ctrl-C stops the trial; otherwise send SIGTERM
to the supervisor PID only after verifying `/proc/PID/cmdline` names this exact
launcher with `start`. Stop the separately owned Mac SSH tunnel and close only
the trial viewer/workspace. Closing the viewer alone does not stop Linux Chrome.
The one-hour deadlines are the fallback, not a reason to skip explicit cleanup.

Verify the recorded VNC/viewer/CDP listeners are gone and the active lock is
absent. If abandoning the trial, remove only its dedicated tooling directory
after that verification and after deciding whether any private trial profiles
need retention. Existing Chrome data, system packages, cmux sessions, credentials
and the managed Pi package profile are not part of rollback.

Sources: [Playwright CDP](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp),
[headed Linux execution](https://playwright.dev/docs/ci#running-headed),
[noVNC architecture](https://novnc.com/info.html).
