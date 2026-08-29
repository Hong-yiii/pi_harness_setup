# 0002: Local, Homelab, And Mobile Operating Model

Date: 2026-07-24

## Status

Superseded in part by ADR 0013

ADR 0013 replaces the Mac-to-homelab control-plane choice with native cmux SSH.
The shared harness, private-networking, and phone-as-control-surface decisions
remain active. ADR 0012 records the historical Remote tmux phase.

## Decision

Use the same harness repo for local and homelab, with host-specific profiles added later.

The default operating model is:

- Local macOS: primary authoring and experimentation.
- Homelab: durable remote agent runtime.
- Phone: attach/control surface for existing remote sessions, not the primary execution environment.

## Rationale

Terminal-agent mobile workflows consistently rely on durable remote sessions. The phone should reconnect to an already-running session over private networking instead of trying to keep fragile mobile processes alive.

## Consequences

- tmux remains a break-glass dependency for existing sessions.
- Tailscale or WireGuard is a core networking dependency.
- Mosh is a likely mobile quality-of-life dependency.
- Notifications and observability need to identify host, session, project, and waiting state.
