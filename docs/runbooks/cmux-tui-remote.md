# cmux TUI Remote Runbook

Status: Ready for disposable pilot use; not yet the accepted durable control plane
Last updated: 2026-08-27

## Purpose

Run Pi on the Ubuntu homelab while the Mac acts as a thin cmux TUI client:

```text
native cmux terminal on Mac
  -> pinned cmux TUI client
  -> managed SSH over Tailscale
  -> Linux cmux TUI `agents-pilot` owner
  -> remote workspaces, terminals, and Pi processes
```

The Linux owner holds the PTYs and workspace tree. Closing or detaching the Mac
client does not stop those remote processes. This is separate from the native
macOS cmux app's Remote tmux feature.

Use only disposable work until the remaining crash, reboot, and interactive Pi
tests pass. Keep established work in the tmux-owned `pi-main` fallback.

## Connect From The Mac

Run this inside a terminal in native cmux:

```bash
npx --yes cmux@0.11.0 remote ssh homelab --session agents-pilot
```

The existing Linux owner is reused. If it is absent, the managed client probes
or installs the compatible remote binary and starts it.

If the session has no workspace, press `Ctrl+b W`. Create another terminal tab
with `Ctrl+b t`.

Inside the remote shell:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/pi_harness_setup
pi --name "cmux TUI pilot"
```

## Daily Keys

| Key | Action |
| --- | --- |
| `Ctrl+b W` | Create a workspace |
| `Ctrl+b t` | Create a terminal tab |
| `Ctrl+b %` | Split right |
| `Ctrl+b "` | Split down |
| `Ctrl+b s` | Show or hide the workspace rail |
| `Ctrl+b d` | Detach the Mac client without stopping the Linux owner |
| `Ctrl+b Ctrl+b` | Send a literal `Ctrl+b` to the active terminal |

Reconnect with the same pinned command. Do not close a Pi terminal when the
intent is to keep it running; detach the client instead.

## Inspect Without Reading Session Contents

From the Mac:

```bash
ssh homelab '~/.local/bin/cmux-tui --session agents-pilot --json server status'
ssh homelab '~/.local/bin/cmux-tui remote-probe --json'
npx --yes cmux@0.11.0 remote known-daemons
```

Expected packaged identity for the current pilot:

```text
distribution_version: 0.11.0
npm_bootstrap_version: 0.11.0
internal binary version: 0.1.0
remote_protocol: 5
```

The package and internal binary versions intentionally come from different
metadata fields; compare distribution, bootstrap, protocol, and build identity
when checking compatibility.

## Implementation

### Mac client

- Runs `cmux@0.11.0` through `npx`; no second global `cmux` command is installed.
- Uses the existing `homelab` OpenSSH alias over Tailscale.
- Requires a trusted host key and noninteractive key or local agent
  authentication.
- Disables SSH agent forwarding, X11 forwarding, and port forwarding.

### Linux owner

- Managed binary: `~/.local/bin/cmux-tui`.
- Named owner: `agents-pilot`.
- Runtime socket: under `$XDG_RUNTIME_DIR` for the current user.
- Remote state: under `~/.local/state/cmux/remote/`.
- The owner holds PTYs/workspaces; an SSH remote-link process and replaceable
  sidecar carry clients to that owner.
- Multiple clients can attach, but every client has the authority of the same
  Linux account over every daemon workspace. Workspaces are not security
  boundaries.

Do not read, copy, or commit auth/state contents. The observed host requires:

```text
~/.local/bin             0755, owned by the homelab user
~/.local/state/cmux      0700, owned by the homelab user
```

The repository bootstrap now creates `~/.local/bin` as `0755`. The account's
`0002` umask caused cmux state children to start as `0775`; the current pilot
state tree was restricted to `0700`. A general multi-session policy remains
`Untested`.

### Deliberately absent

- no public HTTP or WebSocket listener;
- no relay, Iroh, Cloud, or machine provider;
- no systemd user service or reboot restoration;
- no persisted Machines rail configuration;
- no assumption of direct iOS-to-Linux support.

## Current Readiness

Passed:

- pinned managed installation and protocol match;
- Linux-owned workspace and PTY creation;
- complete local client termination and reconnect;
- same remote PID and terminal output after reconnect;
- two simultaneous clients seeing the same workspace;
- cleanup of disposable test state;
- empty-owner stop and managed restart;
- unchanged `pi-main` tmux fallback.

`Untested`:

- the interactive TUI workflow in native cmux;
- a real Pi conversation across detach/reconnect;
- daemon crash and sidecar upgrade behavior;
- Mac and Linux reboot recovery;
- package upgrade/downgrade;
- Machines rail and direct iOS attachment.

## Stop And Roll Back

First exit every disposable Pi/process that should not be terminated. Then stop
the Linux owner from the Mac:

```bash
ssh homelab '~/.local/bin/cmux-tui --session agents-pilot server stop'
```

Stopping the owner terminates its remaining workspaces and PTYs. It cannot move
a live process into tmux.

Return to the validated fallback:

```bash
cmux ssh-tmux homelab
```

Direct recovery remains:

```bash
ssh -t homelab 'tmux attach-session -t pi-main'
```

Do not remove `~/.local/bin/cmux-tui` or `~/.local/state/cmux/` without first
confirming no cmux TUI session is needed.

## References

- Research synthesis:
  `docs/research/2026-08-27-cmux-tui-remote-thin-client.md`
- Execution log:
  `docs/trials/2026-08-27-cmux-tui-remote-pilot.md`
- Fallback/native setup: `docs/runbooks/cmux-setup.md`
- Ubuntu runtime: `docs/runbooks/ubuntu-homelab-setup.md`
