# Native cmux SSH Remote Runbook

Status: Primary Mac-to-homelab workflow
Last updated: 2026-10-14

Current tested installation: **cmux 0.65.1 (110)** with its matching Linux
`cmux-tui` helper. See [upgrade evidence and limitations](../operations/cmux-upgrade-0.65.1.md).
The 0.64.22 lifecycle results below are historical, not proof of current behavior.

## Daily Use

From any terminal inside native cmux:

```bash
cmux ssh homelab
```

A native workspace opens with a shell on the homelab. Work normally:

```bash
cd ~/pi_harness_setup
pi --name "homelab main"
```

That is the complete default workflow. `--name` and `--command` are optional.

## Workspace Scope

Each `cmux ssh` invocation creates one native workspace and one detachable
remote PTY session:

```text
native cmux workspace
  -> SSH management/attachment
  -> Linux remote PTY
  -> shell
  -> project and Pi process
```

The workspace name is only a label. It is not a security boundary or reusable
session key. Running `cmux ssh homelab` twice creates two independent
workspaces.

Recommended convention:

- one workspace per project or worktree;
- panes/tabs within it for related terminals, agents, servers, and browsers;
- one descriptive Pi session name per agent/task.

All workspaces run as the same Linux account and share its filesystem and
credentials.

## Optional Convenience Forms

Name the native workspace:

```bash
cmux ssh homelab --name "Harness"
```

Start Pi immediately:

```bash
cmux ssh homelab \
  --name "Harness" \
  --command 'export PATH="$HOME/.local/bin:$PATH"; cd "$HOME/pi_harness_setup"; exec pi --name "harness-main"'
```

These are conveniences only. Prefer the short command until repetition
justifies more typing or an alias.

## Persistence

Current 0.65.1 uses `cmux-tui` as its remote session backend. Older Rust owners and
legacy helpers may coexist during migration; installing a binary does not migrate
live PTYs. Do not kill them or start duplicate agents merely to align versions.
Same-process reconnect, app relaunch, and sleep/wake on this release remain
**Untested** in our latest acceptance pass.

### Historical 0.64.22 Behavior

In the earlier backend, the remote `cmuxd-remote` daemon owned a detachable PTY. The same cwd, shell,
terminal output, and Pi process survive an SSH transport interruption while
cmux reconnects.

Previously recorded transport behavior (0.64.22):

```text
ServerAliveInterval=20
ServerAliveCountMax=2
reconnect backoff: 3s, 6s, 12s, capped at 60s
```

Historical expectations (do not use as a 0.65.1 teardown contract):

- network or SSH transport drop: remote process stays alive and reattaches;
- temporary VPN/Tailscale interruption: reconnect automatically;
- intentional workspace close: remote session and process end;
- remote shell exit: remote session ends;
- Ubuntu reboot: process ends unless another supervisor owns it.

Complete cmux app quit/relaunch and Mac sleep/wake remain `Untested`. Keep tmux
for critical sessions until those recovery cases are proven.

## Native Remote Features

### Browser panes

For 0.65.1, top-level HTTP loopback navigation is intended to reach the SSH host.
We verified `127.0.0.1` against a same-port Mac decoy; the `localhost` alias remains
untested in that manual pass. The normal upstream URL form is:

```text
http://localhost:3000
```

No manual `ssh -L` forwarding was needed in the native test. Public pages also
loaded, but do not assume they use Linux's network: the newer routing permits
local public navigation. Remote HTTPS and absolute localhost subresource/WebSocket
behavior remain unverified; do not assume full origin isolation from one page test.

### Notifications

The legacy remote relay supported:

```bash
cmux notify --title "Pi" --body "Needs attention"
```

In the fresh 0.65.1 test shell, `cmux` was **not on PATH**, so that command did
not pass. Remote OSC 777 notification delivery did pass. Automatic Pi hook/Feed
behavior remains unverified; do not infer it from OSC delivery.

### Files

Drag-and-drop into a remote terminal uses SCP through the existing SSH
connection.

## Inspect

Legacy helper session inspection (check installed command support first):

```bash
cmux ssh-session-list --all-workspaces
```

Inspect the native workspace tree:

```bash
cmux workspace list
cmux tree --all
```

The current on-disk Linux helper is `~/.local/bin/cmux-tui`. Compare its
`remote-probe --json` build identity with the Mac's bundled helper, not just their
shared `0.1.0` display version. Retained legacy helpers live under:

```text
~/.cmux/bin/cmuxd-remote/<version>/<os>-<arch>/cmuxd-remote
```

Do not copy runtime state or credentials into Git.

## Finish Or Close

When work is complete:

1. exit Pi cleanly;
2. stop any project server that should not remain;
3. exit the remote shell, then close its native workspace.

Do not assume closing a native workspace stops its remote processes. Existing
owners can outlive views. Our 0.65.1 test forward remained after workspace close
and required scoped cleanup; app-quit cleanup was not tested. Never use a broad
process kill to clean up a single workspace.

## Fallback

Existing critical work can remain in Remote tmux:

```bash
cmux ssh-tmux homelab
```

Direct break-glass recovery:

```bash
ssh -t homelab 'tmux attach-session -t pi-main'
```

Do not run native SSH, Remote tmux, and cmux TUI as equal daily controllers.
Native `cmux ssh homelab` is the normal path; the others are recovery/history.

## Historical Validation

Passed with native cmux `0.64.22`:

- versioned daemon bootstrap;
- actual keepalive configuration;
- local and remote carrier replacement;
- same-PID remote process continuity;
- real Pi response and same-PID reconnect;
- native notification relay;
- remote browser routing;
- clean workspace/process teardown.

Detailed log:
`docs/history/2026-08-27-native-cmux-ssh-pilot.md`.

Decision:
`docs/decisions/0013-adopt-native-cmux-ssh-as-primary-homelab-control-plane.md`.
