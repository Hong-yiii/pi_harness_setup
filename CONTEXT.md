# Context

## Goal

Build a reproducible personal harness for Pi that can be recreated from this repo on a local workstation and remote homelab.

## User Preferences

- Research and understanding are more important than immediate execution.
- The harness should support both local and remote use.
- Observability is required.
- Phone interaction is desirable.
- Vim/neovim are not current habits, but learning them is acceptable if it improves TUI workflows.
- Config should be documented and reconstructable from this repo.

## Working Hypothesis

The best shape is a layered harness:

1. **Versioned portable config:** settings, global guidance, agents, prompts.
2. **Terminal/session substrate:** tmux and/or cmux, SSH, mosh, Tailscale/WireGuard.
3. **Observability:** Pi extension telemetry plus session/process heartbeat.
4. **Mobile control surface:** phone terminal attaches to durable remote/local tmux sessions and receives notifications.
5. **Optional richer tools:** MCP, web access, subagent package, context/memory packages, editor integration.

## Current Lean

- Trial a Linux-owned cmux TUI runtime with the Mac acting as a thin client over
  managed SSH/Tailscale.
- Keep cmux Remote tmux and the existing remote tmux sessions as the validated
  fallback until cmux TUI passes daemon failure, reboot, version-skew, rollback,
  and daily UX tests.
- Reuse the versioned lean profile across hosts while keeping credentials,
  package state, and sessions host-local.
- Use Mosh for phone/flaky-network use.
- Prefer OTEL-compatible observability for traces, plus heartbeat/status telemetry for "what is running now?"
- Avoid public web terminals at first.
- Keep Neovim as the preferred learning editor on machines we control, with plain Vim literacy for minimal servers.
- Keep upstream Pi as the documented base for now; trial OMP separately because it is a fork with core behavior, not just a package preset.
- Bring Pi packages in through named profiles (`base`, `research`, `parallel`, `remote`, `experimental`) rather than a single giant install.

## Open Questions

- Which observability backend should be default: local Jaeger, Grafana LGTM, Sentry, LangSmith, or a layered approach?
- Should phone access target local Mac, homelab, or both?
- What exact subagent caps/tool inheritance defaults should become policy?
- How far should Neovim setup go before it becomes too much editor distribution work?
- Is the homelab host a Raspberry Pi, a mini PC, or a server/VM? Hardware affects monitoring and thermal runbooks.
- Can OMP be made reproducible and observable enough for homelab use without losing the repo-as-source-of-truth goal?
- Which real-project friction is strong enough to justify the next package?
- What first repeated workflow is stable enough to encode under `automation/`?

## Current Package Shortlist

The current draft shortlist is captured in:

- `docs/research/2026-08-02-pi-package-shortlist.md`
- `docs/decisions/0006-initial-package-shortlist.md`
- `docs/research/2026-08-03-subagents-phone-ponytail-maturity.md`

Current refinements:

- `pi-subagents` owns conversational delegation and explicit temporary child worktrees.
- Native Git worktrees own persistent PR lanes; start Pi inside each real worktree, optionally through `piwt`.
- Pi Phone, Usher, and dynamic workflows are outside the lean default.
- Ponytail stays at `lite`; its bundled skills are filtered from the normal catalog.
- The general skill shelf is pinned in `skills/`; Pi Lens contributes four additional tool-specific guides.
- Ubuntu homelab rollout is executed: top-level repo checkout, user-scoped
  checksum-pinned Node/Pi, shared lean profile, authenticated smoke, and Pi
  running inside a named tmux session all passed.
- ADR 0012 records the validated `cmux ssh-tmux homelab` baseline. The current
  `agents-pilot` trial evaluates cmux TUI as the Linux PTY/workspace owner while
  preserving ADR 0012 for rollback.
- Remote tmux live validation passed: mirror, safe detach, session survival,
  reattach, and no-relay checks succeeded with native cmux 0.64.22 and tmux 3.4.
- Direct official iOS attachment to a Linux cmux TUI owner remains `Untested`.
  Remote lifecycle/feed integration, Mosh, and direct rather than DERP
  Tailscale connectivity remain optional follow-ups.
- The main operating manual is `docs/manuals/pi-harness-workflow-manual.md`.
- The first-project guide is `docs/manuals/first-real-project.md`.

## Review Gate

Use `docs/reviews/current-plan-review.md` as the living gate before build/configuration batches.

Ideas accumulate there first; once a batch is reviewed, implement it in one coherent pass with rollback and smoke-test notes.
