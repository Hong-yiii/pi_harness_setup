# 0008: Initialize Selected Pi Packages

Date: 2026-08-03

## Status

Initialized locally

## Decision

Initialize the selected package profile project-locally for this repo, excluding Usher.

Selected packages:

- `pi-observability`
- `pi-web-access`
- `pi-lens`
- `@season179/pi-worktree`
- `pi-subagents`
- `@quintinshaw/pi-dynamic-workflows`
- `@dietrichgebert/ponytail`
- `@malinamnam/pi-phone`

Also upgrade the global Pi CLI to `@earendil-works/pi-coding-agent@0.83.0` so package peer requirements match the current runtime.

Applied local defaults:

- dynamic workflows keyword trigger disabled,
- dynamic workflows concurrency/retry/token/time caps added,
- Ponytail default mode set to `lite`,
- bundled example `subagent` user-extension symlink disabled so `pi-subagents` owns the `subagent` tool.

## Rationale

The user asked to execute initialization of the current plan, but explicitly excluded Usher. Installing project-locally lets this repo become the reproducible harness profile without forcing the full experimental setup into every Pi session on the machine.

## Guardrails

- Keep Usher out for now.
- Keep OMP out of the base.
- Keep `context-mode` out until measured.
- Keep Plannotator out until the plan-mode owner is selected.
- Keep hashline/read replacement packages out until `pi-lens` has been trialed alone.
- Use dynamic workflows with keyword trigger off and hard caps.
- Use Ponytail in implementation/review profiles, not default research.
- Use `pi-phone` only behind Tailscale/private networking after source review.

## Follow-Up

- Trial `pi-observability` behavior in a real interactive Pi session.
- Trial `pi-phone` only on private Tailscale/local networking.
- Decide whether `@ast-grep/cli` lifecycle script needs explicit review/approval, even though the binary works.
- Decide first observability/status package behavior after running Pi with the profile.

## Verification

Executed on 2026-08-03:

- `pi --version` returned `0.83.0`.
- `pi list --approve` showed all eight selected project-local packages.
- `npm audit --prefix .pi/npm --omit dev` found zero vulnerabilities.
- `ast-grep --version` returned `ast-grep 0.45.0`.
- `pi-lens build-graph --cwd /Users/hongyilin/Projects/pi_harness_setup` completed successfully.
- `pi --approve --no-session --thinking minimal -p "Reply with exactly: harness-smoke-ok"` returned `harness-smoke-ok`.
