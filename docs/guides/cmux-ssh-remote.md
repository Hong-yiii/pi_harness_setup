# Native cmux SSH Remote Runbook

Status: Primary Mac-to-homelab workflow
Last updated: 2026-08-27

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

The remote `cmuxd-remote` daemon owns a detachable PTY. The same cwd, shell,
terminal output, and Pi process survive an SSH transport interruption while
cmux reconnects.

Current documented/default transport behavior:

```text
ServerAliveInterval=20
ServerAliveCountMax=2
reconnect backoff: 3s, 6s, 12s, capped at 60s
```

Safe expectation:

- network or SSH transport drop: remote process stays alive and reattaches;
- temporary VPN/Tailscale interruption: reconnect automatically;
- intentional workspace close: remote session and process end;
- remote shell exit: remote session ends;
- Ubuntu reboot: process ends unless another supervisor owns it.

Complete cmux app quit/relaunch and Mac sleep/wake remain `Untested`. Keep tmux
for critical sessions until those recovery cases are proven.

## Native Remote Features

### Browser panes

A browser pane created inside the remote workspace routes through the homelab
network. Opening this in that workspace reaches a server bound on Linux:

```text
http://localhost:3000
```

No manual `ssh -L` forwarding is required. Each remote workspace receives an
isolated browser cookie store.

### Notifications

A process in the remote workspace can call:

```bash
cmux notify --title "Pi" --body "Needs attention"
```

The notification appears in the native cmux Feed/sidebar. Notification behavior
for Pi itself depends on its installed remote hooks; the relay command is
available inside the native SSH workspace.

### Files

Drag-and-drop into a remote terminal uses SCP through the existing SSH
connection.

## Inspect

List native SSH PTY sessions without reading terminal content:

```bash
cmux ssh-session-list --all-workspaces
```

Inspect the native workspace tree:

```bash
cmux workspace list
cmux tree --all
```

The versioned Linux helper lives under:

```text
~/.cmux/bin/cmuxd-remote/<version>/<os>-<arch>/cmuxd-remote
```

Do not copy runtime state or credentials into Git.

## Finish Or Close

When work is complete:

1. exit Pi cleanly;
2. stop any project server that should not remain;
3. exit the remote shell or close the native workspace.

Closing the workspace is intentional teardown, not detach. The remote PTY
process ends and the idle daemon exits after its last workspace is gone.

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

## Current Validation

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
