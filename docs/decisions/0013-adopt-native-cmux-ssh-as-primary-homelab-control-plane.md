# 0013: Adopt Native cmux SSH As The Primary Homelab Control Plane

Date: 2026-08-27
Status: Accepted

## Decision

Use native macOS cmux SSH as the single normal Mac-to-homelab path:

```bash
cmux ssh homelab
```

The user then works normally in the remote shell:

```bash
cd ~/pi_harness_setup
pi --name "homelab main"
```

The architecture is:

```text
native cmux on macOS
  -> SSH management and attachment over Tailscale
  -> versioned cmuxd-remote on Ubuntu
  -> detachable remote PTY
  -> shell, project tools, and Pi
```

The native workspace is the visual and lifecycle boundary. Use one workspace
per project or worktree when parallel separation is useful. `--name` and
`--command` are optional conveniences, not requirements or identifiers.

Do not run the Rust cmux TUI as a second daily controller. Its pilot is retained
only as an execution log. The empty `agents-pilot` owner, managed binary, and
state were removed after comparison.

Keep Remote tmux and direct SSH/tmux as break-glass recovery for existing
`pi-main` work, not competing daily interfaces.

## Why

Native `cmux ssh` provides the desired thin-client split without nesting a
second cmux UI:

- Linux owns the detachable PTY and process;
- macOS retains native workspaces, panes, Feed, notifications, browser panes,
  drag-and-drop, and normal shortcuts;
- the remote workspace reconnects automatically after transport loss;
- remote browser traffic routes through the homelab network without manual
  `ssh -L` forwarding;
- remote processes can notify the native cmux sidebar;
- the official iOS beta can continue using its documented Mac-companion path.

The Rust cmux TUI also proved disconnect durability and multi-client behavior,
but it introduced a second sidebar, separate keybindings/configuration, and a
second high-authority controller while losing native macOS integrations. It is
not needed for the current one-Mac/one-homelab operating model.

## Persistence Semantics

The native SSH path uses a versioned `cmuxd-remote` detachable PTY daemon.
Current documentation and validation establish:

- remote PTYs survive SSH transport loss;
- cmux reconnects with exponential backoff;
- default SSH keepalives are `ServerAliveInterval=20` and
  `ServerAliveCountMax=2` unless already configured;
- the same remote process and terminal state reattach after local or remote
  carrier replacement;
- intentionally closing the workspace terminates its remote session.

Complete native-app quit/relaunch, Mac sleep/wake, and remote reboot remain
`Untested`. Keep critical existing work in tmux until the relevant recovery path
is proven. Pi's host-local session history remains available for application-
level resume even when a process no longer exists.

## Supersedes

This decision supersedes the Mac control-plane choice in ADR 0012. ADR 0012
remains historical evidence for Remote tmux and defines the fallback path.

It supersedes the corresponding Mac control-plane wording in ADRs 0002 and
0011, but not their shared-harness, host-local credentials, private networking,
or phone-fallback decisions.

## Trust And State

- SSH uses the existing reviewed `homelab` alias over Tailscale.
- The first connection installs a versioned helper at
  `~/.cmux/bin/cmuxd-remote/<version>/<os>-<arch>/cmuxd-remote`.
- The helper is verified against a SHA-256 manifest embedded in the native app.
- Remote cmux runtime state remains host-local and outside Git.
- Browser panes use the remote network and an isolated cookie store per remote
  workspace.
- Closing a workspace is an intentional remote-session teardown; do not use it
  as a detach gesture.

## Validation

Executed with native cmux `0.64.22` and the Ubuntu homelab:

- confirmed actual SSH keepalive arguments `20` and `2`;
- killed the remote stdio carrier and reattached to the same remote PID;
- killed the local OpenSSH transport and reattached to the same remote PID;
- routed a remote `cmux notify` event into the native notification Feed;
- loaded a homelab-loopback HTTP server in a native browser pane without manual
  forwarding;
- ran a real authenticated Pi prompt and received
  `native-cmux-ssh-pi-ok`;
- killed the local transport and confirmed that Pi retained the same PID and
  screen state;
- closed all disposable workspaces and confirmed their processes and remote
  daemon exited;
- confirmed tmux `pi-main` remained unchanged.

Execution details:
`docs/history/2026-08-27-native-cmux-ssh-pilot.md`.

## Daily Use

```bash
cmux ssh homelab
```

Then:

```bash
cd /path/to/project
pi --name "project-name"
```

Detailed operations:
`docs/guides/cmux-ssh-remote.md`.

## Rollback

Use the existing Remote tmux fallback:

```bash
cmux ssh-tmux homelab
```

Or attach directly:

```bash
ssh -t homelab 'tmux attach-session -t pi-main'
```

No native SSH workspace must be migrated. Finish or stop it explicitly before
switching controllers.
