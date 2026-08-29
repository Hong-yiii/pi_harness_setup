# 0011: Use A Shared Harness With A Host-Local Linux Runtime

Date: 2026-08-26
Status: Superseded in part by ADR 0013

ADR 0013 replaces only the Mac control-plane choice. The shared profile,
host-local state, and Remote tmux fallback remain active.

## Decision

Use the same versioned lean Pi profile on macOS and the Ubuntu homelab.
Install runtime dependencies, Pi packages, credentials, and session files per
host rather than synchronizing the live `~/.pi/agent` directory.

On the homelab:

- clone this repository at `~/pi_harness_setup`;
- install a checksum-pinned Node LTS runtime at user scope;
- install the repository-pinned Pi CLI and apply the lean profile;
- run normal remote work through native `cmux ssh homelab`, whose versioned
  Linux helper owns detachable PTYs;
- keep existing named tmux sessions only as break-glass recovery;
- keep the native cmux app and daily visual control surface on macOS.

## Why

The portable assets already live in Git, while generated package state,
credentials, and session histories have different trust and lifecycle needs.
Copying the live Pi directory between hosts would mix secrets, absolute paths,
platform-specific npm artifacts, and unrelated session history.

Running Pi on the homelab makes all built-in and extension tools operate in the
remote filesystem naturally. Native cmux SSH keeps the remote PTY alive across
transport drops; tmux remains available for existing critical sessions.

## Consequences

- Git carries settings, agents, prompts, skills, package pins, tmux defaults,
  scripts, and runbooks.
- Each host performs its own package install from the shared profile.
- `auth.json`, API keys, sessions, npm installation state, SSH state, and cmux
  runtime files stay machine-local and out of Git.
- tmux is retained for break-glass recovery; Mosh and Neovim remain optional.
- ADR 0013 makes native `cmux ssh homelab` the normal path and leaves ADR 0012
  Remote tmux as historical fallback.
- Node and Pi upgrades are reviewed repository changes rather than ambient
  host drift.

## Rollback

Restore Pi and tmux files from the bootstrap/apply backups, remove only the
user-scoped Node/Pi paths created for this runtime, and stop rollout-created
tmux sessions. Do not remove Tailscale, SSH configuration, credentials, or
unrelated system packages as part of this rollback.
