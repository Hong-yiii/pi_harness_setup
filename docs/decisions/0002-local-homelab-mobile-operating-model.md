# 0002: Local, Homelab, And Mobile Operating Model

Date: 2026-07-24

## Status

Draft

## Decision

Use the same harness repo for local and homelab, with host-specific profiles added later.

The default operating model is:

- Local macOS: primary authoring and experimentation.
- Homelab: durable remote agent runtime.
- Phone: attach/control surface for existing tmux sessions, not the primary execution environment.

## Rationale

Terminal-agent mobile workflows consistently rely on durable remote sessions. The phone should reconnect to an already-running session over private networking instead of trying to keep fragile mobile processes alive.

## Consequences

- tmux is a core dependency.
- Tailscale or WireGuard is a core networking dependency.
- Mosh is a likely mobile quality-of-life dependency.
- Notifications and observability need to identify host, session, project, and waiting state.
