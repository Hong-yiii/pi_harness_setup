# 0012: Adopt cmux Remote tmux As The Primary Homelab Control Plane

Date: 2026-08-27
Status: Accepted

## Decision

Use cmux Remote tmux as the normal Mac-to-homelab interface:

```text
cmux on macOS
  -> SSH tmux control mode (`tmux -CC`)
  -> tmux server on the Ubuntu homelab
  -> Pi in a project checkout
```

The normal attach command is:

```bash
cmux ssh-tmux homelab
```

This is a control-plane cutover, not removal of tmux. Remote tmux is a cmux
projection of the real remote tmux server and requires tmux 3.2 or newer. tmux
continues to own process durability.

Deprecate the previous normal Mac path of `cmux ssh ... --command 'tmux ...'`.
Keep plain SSH attachment only as a break-glass recovery path, not a competing
daily control surface. Phone access remains SSH/Mosh into the same tmux server
until a separate mobile control plane is reviewed.

## Why

Remote tmux exposes the remote hierarchy directly in cmux:

- tmux session -> cmux workspace;
- tmux window -> cmux tab;
- tmux pane -> native cmux split.

This removes the nested-multiplexer experience while retaining remote process
survival and standard tmux recovery. The current environment meets the
requirements: cmux 0.64.22, working SSH alias `homelab`, and remote tmux 3.4.

The feature remains beta, but this harness has no production availability
requirement and rollback does not migrate or destroy session state. The remote
tmux server remains independently attachable if the cmux mirror fails.

## Supersedes

This decision supersedes only the Mac control-plane portions of:

- ADR 0002, where generic SSH/tmux was the default remote interaction model;
- ADR 0011, where cmux was optional and Remote tmux remained an optional test;
- the original cmux setup batch, where plain `cmux ssh` was primary and
  `cmux ssh-tmux` was deferred.

It does not supersede host-local credentials, the shared lean Pi profile,
Tailscale reachability, or tmux as the durable remote substrate.

## Accepted Beta Limits

- cmux does not restore Remote tmux mirrors after app relaunch; rerun
  `cmux ssh-tmux homelab`.
- Closing, splitting, or reordering mirrored panes mutates the actual tmux
  session.
- Multi-line paste is sent as keystrokes rather than one bracketed paste.
- Historical primary-screen scrollback may retain its old width after resize.
- Current upstream issue reports include focus/lifecycle rough edges and races
  when attaching many sessions.

## Trust And State

Remote tmux uses SSH plus `tmux -CC`. It does not require the `cmux ssh` relay
as part of the documented attach path. Do not install the plain-SSH cmux relay
unless browser proxying, remote uploads, or remote-to-local cmux commands are
separately approved.

The beta toggle is stored in cmux app preferences, not the repository
`cmux.json` schema. Back up the cmux preference domain before enabling it.

## Consequences

- `cmux ssh-tmux homelab` becomes the documented daily Mac entry point.
- A remote tmux session must exist before mirroring; use a narrow SSH command
  to create one when needed.
- Plain `cmux ssh ... tmux ...` is deprecated.
- Direct SSH/tmux is documented only for recovery and diagnostics.
- The tmux package, config, and session naming conventions remain required.
- cmux-specific Pi lifecycle hooks on the remote are not assumed; Remote tmux
  mirrors terminal state, not native remote Pi hook state.

## Rollback

Disable Settings -> Beta Features -> Remote tmux and attach directly:

```bash
ssh -t homelab 'tmux attach-session -t pi-main'
```

No session migration or remote package removal is required. The remote tmux
server and Pi process continue running.
