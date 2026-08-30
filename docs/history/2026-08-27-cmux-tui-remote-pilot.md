# cmux TUI Remote Pilot Log — 2026-08-27

This is an execution log, not a decision or daily-use runbook.

The active TUI runbook was removed after ADR 0013 selected native cmux SSH.
This file remains only as historical trial evidence.

## Scope

Test whether the Ubuntu homelab can own cmux TUI workspaces and PTYs while a
Mac client attaches over managed SSH. Keep the existing tmux `pi-main` session
untouched.

## Baseline

Mac:

- Node `v24.4.1`;
- npm/npx `11.16.0`;
- native cmux `0.64.22`;
- SSH alias `homelab` working over Tailscale.

Homelab:

- Ubuntu 24.04 x86_64;
- user-scoped Node `v24.20.0`;
- npm/npx `11.19.0`;
- `cmux-tui` absent;
- tmux `pi-main` running.

Selected package:

- npm distribution `cmux@0.11.0`;
- Node requirement `>=18`;
- packaged macOS/Linux binaries from the official `manaflow-ai/cmux` package.

## Execution

### 1. Preflight

Passed strict noninteractive SSH with trusted host-key checking and forwarding
disabled.

Local package probe printed internal binary version `0.1.0`. The later remote
probe confirmed this was paired with distribution/bootstrap version `0.11.0`,
remote protocol 5, and the same build identity.

### 2. First managed install attempt

Command:

```bash
npx --yes cmux@0.11.0 remote ssh homelab \
  --session agents-pilot --headless --json
```

Result: failed closed.

Error:

```text
install parent must be owned by the current user and not group or world writable
```

Cause: remote `~/.local/bin` was user-owned but mode `0775`.

Correction:

```bash
chmod 0755 ~/.local/bin
```

Repository follow-up: `scripts/bootstrap-ubuntu-homelab.sh` now creates
`~/.local/bin` with explicit mode `0755`.

### 3. First daemon startup attempt

The managed binary installed, but the Linux owner failed identity storage.

Error:

```text
secure directory .../auth has an ancestor writable by other users
```

Cause: the account's `0002` umask created cmux-owned state directories with
mode `0775`.

Pilot correction:

```bash
find ~/.local/state/cmux -type d -exec chmod 0700 {} +
```

This corrected the current pilot tree. A durable multi-session umask/state
policy was not added during this trial.

### 4. Owner startup

The retry connected successfully over direct SSH.

Observed remote identity:

```text
distribution_version: 0.11.0
npm_bootstrap_version: 0.11.0
internal version: 0.1.0
remote_protocol: 5
architecture: x86_64 Linux
```

Observed components:

- headless `agents-pilot` owner;
- SSH remote-link process;
- replaceable remote sidecar;
- managed binary at `~/.local/bin/cmux-tui`;
- owner state under `~/.local/state/cmux/remote/`.

No public HTTP/WebSocket, relay, Iroh, Cloud, or forwarding listener was enabled.

### 5. Disconnect/reconnect test

Created a disposable `pilot-smoke` workspace and terminal running:

```bash
printf "cmux-owner-ok\n"
exec sleep 600
```

Recorded its remote PID and terminal snapshot, then terminated the entire local
headless client.

Remote checks confirmed:

- the Linux owner remained running;
- the disposable process retained the same PID;
- `pi-main` remained present in tmux.

A new managed SSH client attached to `agents-pilot`. It listed the same
workspace and read the same `cmux-owner-ok` terminal snapshot from the original
PID.

Result: passed.

### 6. Concurrent-client test

Attached a second simultaneous headless client. It listed the same workspace
and terminal state.

Result: passed.

### 7. Cleanup

- closed the disposable workspace;
- terminated the disposable sleep process;
- stopped both local headless test clients;
- left the empty Linux `agents-pilot` owner running for interactive use;
- verified tmux `pi-main` remained unchanged;
- verified the remote Git checkout remained clean.

### 8. Owner stop/restart rollback test

Stopped the empty owner from the Mac:

```bash
ssh homelab '~/.local/bin/cmux-tui --session agents-pilot server stop'
```

Confirmed server status no longer reported a running owner. The pinned managed
SSH command then started a new owner generation and connected successfully. The
local validation client was terminated, and remote status confirmed the Linux
owner remained running while tmux `pi-main` was still present.

Result: passed.

### 9. Decommission after native SSH comparison

Native `cmux ssh` subsequently passed transport reconnect, real Pi continuity,
notification, and remote-browser tests while retaining the native Mac UI. The
TUI path was therefore rejected as a competing daily controller.

Verified `agents-pilot` had no workspaces, stopped the owner, then removed only:

```text
~/.local/bin/cmux-tui
~/.local/state/cmux/
```

The native `~/.cmux/bin/cmuxd-remote/` helper and tmux `pi-main` fallback were
left intact.

## Final State

```text
agents-pilot owner: stopped
remote TUI binary/state: removed
pilot workspace/process: removed
native cmux SSH helper: retained
tmux pi-main: unchanged
```

## Passed

- official pinned package bootstrap;
- client/server protocol compatibility;
- Linux-owned PTY/workspace;
- client disconnect and reconnect;
- terminal snapshot continuity;
- two simultaneous clients;
- clean disposable-test teardown;
- empty-owner stop and managed restart;
- unchanged fallback session.

## Untested

- interactive TUI use inside native cmux;
- real Pi session detach/reconnect;
- daemon crash;
- Linux or Mac reboot;
- systemd supervision;
- upgrade/downgrade;
- Machines rail;
- direct official iOS attachment to Linux.
