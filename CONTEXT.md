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

- Treat `tmux + Tailscale + SSH` as the minimum remote/homelab substrate.
- Add `cmux` as an intended interface layer to evaluate alongside tmux.
- Add Mosh for phone/flaky-network use.
- Prefer OTEL-compatible observability for traces, plus heartbeat/status telemetry for "what is running now?"
- Avoid public web terminals at first.
- Keep vim/neovim as a learning track, not a hard harness dependency yet.
- Keep upstream Pi as the documented base for now; trial OMP separately because it is a fork with core behavior, not just a package preset.
- Bring Pi packages in through named profiles (`base`, `research`, `parallel`, `remote`, `experimental`) rather than a single giant install.

## Open Questions

- Which observability backend should be default: local Jaeger, Grafana LGTM, Sentry, LangSmith, or a layered approach?
- Should local and homelab share one `~/.pi/agent` via this repo, or should the repo generate per-host configs?
- Should phone access target local Mac, homelab, or both?
- Should we adopt `pi-subagents` package or keep the bundled example extension until needs are clearer?
- Should vim/neovim be a core dependency or a learning track outside the harness?
- Is the homelab host a Raspberry Pi, a mini PC, or a server/VM? Hardware affects monitoring and thermal runbooks.
- Can OMP be made reproducible and observable enough for homelab use without losing the repo-as-source-of-truth goal?
- Which packages graduate to `base` versus profile-only?
- Should deterministic loop code live in scripts/SDK examples inside this repo, while orchestrator packages live in the `parallel` profile?

## Current Package Shortlist

The current draft shortlist is captured in:

- `docs/research/2026-08-02-pi-package-shortlist.md`
- `docs/decisions/0006-initial-package-shortlist.md`

## Review Gate

Use `docs/reviews/current-plan-review.md` as the living gate before build/configuration batches.

Ideas accumulate there first; once a batch is reviewed, implement it in one coherent pass with rollback and smoke-test notes.
