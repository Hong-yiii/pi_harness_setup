# Scratchpad

## Current Read

Pi is less a sealed coding product and more a terminal agent runtime. The workflow win is not "find the one perfect package"; it is building a small personal distribution around Pi:

- portable prompts and agents,
- hard enforcement through extensions,
- observability as a first-class layer,
- durable terminal sessions,
- phone as an attach/control surface.

## Candidate Shape For Me

```text
pi_harness_setup/
  pi/agent/              # copy/sync into ~/.pi/agent
  docs/research/         # what others do
  docs/decisions/        # what we choose
  docs/runbooks/         # how to rebuild and operate
  scripts/               # later: apply, validate, diff, backup
```

## Compare Notes Later

- What blogs make Pi look compelling?
- Which packages feel essential versus shiny?
- What parts should be prompt-only, and what parts need enforced extension behavior?
- How much mobile control do I actually want: check-ins, approvals, or full authoring?
- What visibility do I need daily: cost, stuck sessions, tool calls, traces, replayable logs?

## My Current Convergence

Start boring and durable:

1. `tmux` is the session truth.
2. Tailscale gives private reachability.
3. Mosh makes phone access tolerable.
4. Pi config lives in this repo and is applied outward.
5. Observability starts with traces plus process heartbeat, not screenshots or giant logs.
6. Packages are audited/pinned one at a time.

## Candidate First Experiments

- Run Pi inside named tmux sessions locally.
- Test phone attach over Tailscale + SSH.
- Test Mosh once SSH works.
- Spin up local Jaeger and evaluate `pi-otel`.
- Evaluate `@jademind/pi-telemetry` for status/heartbeat.
- Compare bundled subagent extension against `pi-subagents`.
- Trial OMP separately against the same task set; do not make it the base until it beats upstream Pi on observed workflow, reproducibility, and homelab fit.

## OMP Question

My current read: OMP is tempting because it compresses a lot of yak-shaving into a rich terminal coding surface. The danger is that it makes the base opaque. For this harness, the cleanest move is probably:

1. Keep upstream Pi as the source-of-truth base.
2. Add an `omp/` trial lane if we test it.
3. Steal ideas from OMP into explicit docs/extensions/packages only when they survive comparison.

## Decision Flow Draft

Choose OMP first if I want the richest terminal coding workbench right now and am happy to pin/audit a fast-moving fork.

Choose upstream Pi first if I want the repo to stay the source of truth and add capability deliberately.

Current instinct: upstream Pi is the base, OMP is the benchmark.

## 2026-08-02 Package Intake

I want a package chart, not a shopping spree. Candidate axes:

- Code exploration: likely `pi-lens`, maybe codegraph/semantic search packages.
- Web research: likely `pi-web-access`.
- Context: debate `context-mode`.
- Plan mode: compare bundled plan mode vs Plannotator.
- Subagents: likely `pi-subagents`.
- Orchestration: debate `@quintinshaw/pi-dynamic-workflows`.
- Worktrees: must-have, likely via `pi-subagents` and/or `pi-dynamic-workflows`.
- UI: evaluate sidebar/status/web UI packages after core flow works.
- Remote: tmux/Tailscale first; package layer second.
- Interface: user intends to use `cmux`; evaluate how it fits with tmux/Tailscale rather than assuming only one terminal multiplexer/control surface.

Initial synthesis after critique pass:

- Keep upstream Pi as the base.
- Use profiles: base, research, parallel, remote, experimental.
- Strong early candidates: one observability/status package, `pi-web-access`, `pi-lens`, one worktree package, then `pi-subagents`.
- Build deterministic loop/eval harnesses in this repo using Pi SDK/RPC/JSON mode.
- Trial `@quintinshaw/pi-dynamic-workflows` later as the orchestrator lane, not as the evaluation truth. It is complementary to `pi-subagents`, but overlaps in fanout, status, budgets, model routing, and worktrees. Disable triggers and cap fanout.
- Use Ponytail as a selected implementation/review trial, not research default.
- Keep `context-mode`, browser/phone UI, and read/edit replacement packages in experimental until measured.
- Keep one owner per surface: web/fetch, code exploration, read/edit replacement, plan mode, worktrees, observability UI, remote/mobile, orchestration.
- New repo ritual: accumulate ideas in `docs/reviews/current-plan-review.md`, then build from reviewed batches.

## 2026-08-03 Chart Iteration

- `pi-subagents`: most mature Pi-native subagent candidate. Day-to-day delegation owner.
- `@quintinshaw/pi-dynamic-workflows`: promising orchestrator candidate. Trial later with `/workflows-trigger off`, budgets, and reviewed saved workflows.
- `pi-phone`: Pi-native phone UI, but low adoption and unknown license. Use only behind Tailscale after source review.
- Usher: not a Pi package, but attractive cross-agent browser/PWA hub for Pi + Codex + Claude. Very early adoption, clearer security docs.
- Ponytail: use, but profile-scoped. Good for implementation/review taste; off during research unless requested.
