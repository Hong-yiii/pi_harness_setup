# 0016: Use a service-owned shared Linux browser

Date: 2026-10-15
Status: Accepted by owner; implementation/host evidence in the operation

## Decision

Use one dedicated, sandboxed Linux Chrome for both Playwright automation and
human viewing/input through noVNC. A user-level systemd unit owns Chrome,
Xvfb, x11vnc and websockify. Pi is a client, not the process supervisor.
The service is started explicitly, has an eight-hour runtime cap, and does not
autostart or restart after crashes. Its private profile persists across runs;
live DOM/process state does not survive service termination.

A repository-owned thin Pi extension provides `/browser` connection/lifecycle
commands and one bounded `shared_browser` tool. The Linux client uses a private
Unix socket via a stdio CLI; the Mac client invokes the same CLI over the reviewed
SSH alias. Mac viewer connections forward only the loopback viewer port, never
CDP. Pi reload/disconnect may close its own tunnel but must not stop the service.

A `shared-browser` skill explains targeting, observation, actions and handoff.
A separate `cmux-browser` skill covers native Mac WKWebView panes. The two target
different browser engines; neither replaces pi-web-access's research ownership.
The service, extension and skill have code/instructions appropriate to their
roles; a skill is not a lifecycle or authorization mechanism.

## Why

The earlier trial proved that a second Playwright client and the Mac VNC viewer
can operate on the same Linux page. It also showed why the browser must not be
owned by the viewing SSH connection. Systemd provides existing cgroup cleanup
instead of maintaining custom orphan-process tracking in an agent extension.

The [LinuxServer Chromium/Selkies launcher](https://github.com/linuxserver/docker-chromium/blob/master/root/usr/bin/wrapped-chromium)
inspected on 2026-10-15 used `--no-sandbox`, so that package was not adopted unchanged. A Playwright container would still need a
viewer and verified rootless sandbox setup. Reuse the already demonstrated native
Chrome stack rather than add a container runtime merely because binaries exist.
Extracted Ubuntu dependencies remain an explicit maintenance liability: they
need reviewed replacement and inventory checks, not assumed apt updates.

## Trust and coordination

Use authenticated VNC, X authorization with no X TCP listener, private files,
a loopback CDP endpoint and a private Unix control socket. Never import personal
profiles or put viewer secrets in model output, command arguments or URLs.
Same-account processes retain OS authority; this is not a sandbox against Pi's
Bash tool or other local users with CDP access.

Service actions validate inputs, use explicit generation-scoped tab handles,
serialize operations and require a single expiring controller lease. Human
handoff releases that lease. Physical VNC input is not blocked by the automation
lease: user and agent must still coordinate who is driving. Read-only agent
allowlists are not expanded by installing skills.

## Delivery and recovery

Portable skills/extension are published on both hosts through the shared apply
script. Linux service code is installed in versioned user-scoped releases;
connection configuration, dependencies, cookies, screenshots and private state
stay host-local. No cmux upgrade or owner restart is part of this decision.

Stop only `pi-browser.service` before changing its release. Preserve profile
state and prior releases; restore the previous unit/release and copied Pi assets
using the recorded backups. Do not restore private profiles across machines.
See [Shared browser operation](../operations/shared-browser.md) for checks and
residual limits; the original [trial](../operations/linux-browser-trial.md) is
historical evidence rather than the new lifecycle owner.
