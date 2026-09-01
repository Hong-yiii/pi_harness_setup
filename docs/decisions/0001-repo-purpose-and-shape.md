# 0001: Repo Purpose And Shape

Date: 2026-07-24

## Status

Superseded in part by ADR 0014

## Decision

Create `~/Projects/pi_harness_setup` as the source of truth for reconstructing the Pi harness.

The repo is organized into:

- `pi/agent/` for versioned Pi user-level assets.
- `docs/reference/` for source-backed research.
- `docs/decisions/` for durable decisions.
- reader-oriented documentation areas for onboarding, guides, and operations.
- `scratchpad.md` for active thinking.

## Rationale

Pi is intentionally small and customizable. A personal harness needs its own source of truth so local and homelab environments can converge without relying on undocumented manual state under `~/.pi/agent`.

## Consequences

- Raw secrets and session logs stay out of git.
- `~/.pi/agent` becomes generated/applied state, not the only source.
- We need apply/validate scripts once the shape stabilizes.
