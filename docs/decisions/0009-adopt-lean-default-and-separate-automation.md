# 0009: Adopt A Lean Default And Separate Automation

Date: 2026-08-03
Status: Accepted

## Decision

The normal Pi session loads six package owners:

- `pi-observability`,
- `pi-web-access`,
- `pi-lens`,
- `pi-subagents`,
- `@dietrichgebert/ponytail`,
- `pi-background-tasks@0.6.0`.

Remove `@quintinshaw/pi-dynamic-workflows` and `@malinamnam/pi-phone` from
the default. Keep plan mode and the cmux lifecycle hook.

Custom routing, deterministic loops, and evals belong under `automation/`.
They run explicitly and do not register ambient tools or instructions in every
interactive session.

Pi advertises these general skills:

- `diagnose`,
- `caveman`,
- `grill-with-docs`,
- `handoff`,
- `to-prd`,
- `to-issues`,
- `zoom-out`.

Package-level skills and prompts are disabled where possible. Pi Lens injects
four operational skills from its extension hook; retaining Pi Lens means those
four remain visible.

## Why

The first profile mixed daily tools, an orchestrator, a phone server, package
skills, prompts, and UI commands. It was useful for discovery but made startup
harder to understand and increased the model-visible catalog.

The lean profile keeps the user's daily priorities while making high-authority
automation explicit and testable. The repo can still research alternatives
without loading them.

Version `0.6.0` of `pi-background-tasks` is pinned because it provides focused
background shell jobs, bounded logs, stop controls, completion wakeups, and a
task UI. Later releases also add an always-active multi-model Fusion workflow,
which belongs outside the default.

## Consequences

- A fresh clone can apply the user-level setup with one script.
- The `.pi/` directory remains a local development fixture for this harness.
- Phone access uses Tailscale plus SSH/Mosh and durable tmux sessions.
- New routing ideas must first become explicit code and eval cases under
  `automation/`.
- The desired general skill shelf is small, but Pi Lens contributes four extra
  tool-specific entries unless it is removed or forked.
- Persistent PR lanes use native Git worktrees and the optional `piwt` shell
  helper; see decision 0010.
