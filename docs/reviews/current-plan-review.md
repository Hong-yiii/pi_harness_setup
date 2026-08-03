# Current Plan Review

Date started: 2026-08-02
Status: Draft, not ready to build

## Purpose

This is the gate between research and implementation.

Use this document to accumulate the current shape of the Pi harness, unresolved ideas, and candidate build batches. When enough ideas have converged, update this review, mark a build batch as ready, and only then implement the batch.

The goal is to avoid installing or wiring one package at a time just because it looks interesting. The harness should change in reviewed, reproducible batches.

## Review Rule

Before any meaningful build/configuration pass:

1. Add the proposed change to this document.
2. Classify it as `Decided`, `Leaning`, `Trial`, `Open`, or `Rejected`.
3. Identify the affected surface: web/search, code exploration, read/edit, plan mode, worktrees, subagents, orchestration, observability, remote/mobile, UI, or safety.
4. Check that the change does not introduce a second owner for the same high-authority surface.
5. Add install, rollback, smoke test, and trust notes if the change touches Pi packages or remote access.
6. Move the change into the next build batch only after review.

## Current North Star

Build a reproducible personal Pi harness for:

- local laptop work,
- remote homelab work over private networking,
- phone interaction with durable sessions,
- observable agent runs,
- parallel workflows through worktrees and subagents,
- deterministic loops/evals owned by this repo,
- optional orchestrator-managed loops after the basics are stable.

## Current Shape

| Layer | Current State | Notes |
|---|---|---|
| Base Pi | Use upstream Pi as documented base. | OMP remains a separate benchmark/trial lane, not the foundation. |
| Repo as source of truth | Active. | Config, decisions, runbooks, prompts, agents, and future scripts live here. |
| Package policy | Drafted. | Use profiles: `base`, `research`, `parallel`, `remote`, `experimental`. |
| Safety | Underdefined. | Needs explicit package audit checklist and secret/log policy before autonomy increases. |
| Terminal/session interface | tmux/Tailscale baseline, cmux intended as an interface, mosh possible for phone/flaky networks. | Need compare cmux vs tmux roles rather than treating them as mutually exclusive too early. |
| Observability | Required, not selected. | Likely one local status layer first, then OTLP/Langfuse later if needed. |
| Web research | `pi-web-access` is leading candidate. | Research profile first, browser-cookie paths disabled. |
| Code exploration | `pi-lens` is leading candidate. | Trial alone before any read/edit replacement package. |
| Read/edit replacement | Stock Pi first. | `pi-hashline-readmap` or `pi-readseek` later, one at a time. |
| Plan mode | Existing/simple plan mode first. | Plannotator is a trial candidate if visual annotation matters. |
| Worktrees | Must-have. | Pick exactly one manual worktree owner first. Dynamic workflows may own orchestrated worktrees later. |
| Subagents | Important. | `pi-subagents` is likely first package after worktree flow. |
| Orchestration | Desired but later. | `@quintinshaw/pi-dynamic-workflows` is strongest candidate; trigger off and hard caps if trialed. |
| Deterministic loops/evals | Repo-owned. | Build with Pi SDK/RPC/JSON mode; this is the evaluation truth. |
| Remote/mobile | Tailscale + durable sessions first. | Trial one phone/web/Telegram/Usher-style surface after threat model. |
| Minimalism/taste | Ponytail is interesting. | Keep opt-in for implementation/review, not research. |
| Context/memory | `context-mode` is interesting. | Experimental until measured on real research tasks. |

## Surface Ownership

Pick one active owner per high-authority surface:

| Surface | First Owner | Trial Later | Avoid |
|---|---|---|---|
| Web/search/fetch | `pi-web-access` | `context-mode` fetch/index tools | Multiple web/MCP fetch stacks at once |
| Code exploration | `pi-lens` | semantic index package | Installing LSP/index/hashline bundles together first |
| Read/edit replacement | stock Pi | `pi-hashline-readmap` or `pi-readseek` | More than one read/edit override |
| Plan mode | bundled/simple plan mode | Plannotator | Two plan owners with different approval state |
| Manual worktrees | one narrow worktree package | `pi-worktree` or `@pandi-coding-agent/worktree` | Multiple worktree managers |
| Orchestrated worktrees | none initially | `@quintinshaw/pi-dynamic-workflows` | Letting two orchestrators own branch cleanup |
| Human status | one local status package | sidebar/dashboard packages | Multiple footers/sidebars/cost widgets |
| Remote/mobile | SSH/tmux/Tailscale/cmux baseline | one web/phone/Telegram/Usher surface | Public web exposure or multiple remote controllers |

## Candidate Build Batch 1

Status: Not ready

Goal: create the boring substrate before adding autonomy.

Candidate contents:

- package profile manifest shape,
- package audit checklist,
- rollback convention,
- secret/log policy,
- cmux/tmux/Tailscale terminal interface notes,
- one local observability/status trial,
- `pi-web-access` trial config with browser cookies disabled.

Open gates:

- choose first observability/status package,
- decide how cmux and tmux divide responsibility,
- define package install/pin/rollback format,
- define where machine-local secrets live.

## Candidate Build Batch 2

Status: Not ready

Goal: add code exploration and safe parallel workspace behavior.

Candidate contents:

- `pi-lens` trial,
- one manual worktree package trial,
- `pi-subagents` trial,
- first deterministic RPC/SDK eval skeleton.

Open gates:

- choose manual worktree owner,
- decide subagent caps and tool inheritance rules,
- choose a small real repo/task set for eval comparison.

## Candidate Build Batch 3

Status: Not ready

Goal: add richer orchestration and remote/mobile surfaces.

Candidate contents:

- one plan-mode owner trial,
- `@quintinshaw/pi-dynamic-workflows` trial with trigger off and hard caps,
- one remote/mobile surface over Tailscale,
- `context-mode` before/after measurement,
- optional Ponytail implementation/review mode.

Open gates:

- finish Batch 1 and Batch 2,
- write remote threat model,
- define fanout budgets and workflow artifact storage,
- decide what measurements make `context-mode` worth keeping.

## Accumulated Ideas

| Idea | Status | Notes |
|---|---|---|
| Use upstream Pi as base | Decided | OMP is benchmark/trial lane. |
| Package profiles | Decided | `base`, `research`, `parallel`, `remote`, `experimental`. |
| Review gate before build | Decided | This document is the gate. |
| cmux as interface | Leaning | User intends to use cmux; compare with tmux/session substrate. |
| Web search | Leaning | `pi-web-access` first. |
| Advanced code exploration | Leaning | `pi-lens` first. |
| Worktrees | Decided | Must-have. Owner not selected. |
| Subagents | Decided | Important. Likely `pi-subagents` first. |
| Read-only agent archetypes | Trial | Iterate user-scoped `researcher`, `scout`, and `reviewer` around bounded trajectories, evidence discipline, and explicit read-only runtime metadata. Prefer inherited project context and task contracts over same-name project shadows. |
| Deterministic loops | Decided | Repo-owned SDK/RPC/JSON harness. |
| Orchestrator loops | Trial | `@quintinshaw/pi-dynamic-workflows` later. |
| Remote phone access | Trial | Tailscale/private network first, one remote surface later. |
| context-mode | Open | Debate with measurement. |
| Ponytail | Open | Likely opt-in implementation/review taste layer. |

## Agent Archetype Iteration 2026-08-03

Status: Trial approved; versioned prompts updated, global apply and deterministic evals pending

Affected surfaces: subagents, safety, orchestration, and observability.

Trial contents:

- keep `researcher`, `scout`, and `reviewer` as stable user-scoped primitives;
- add `acceptanceRole: read-only` and `completionGuard: false` because all three retain inspection-only `bash`;
- inherit trusted project instructions while keeping fresh child conversation context;
- give each role an explicit trajectory and stop behavior;
- persist large outputs through the parent/runtime `output` contract rather than conflicting child write instructions;
- use project `AGENTS.md` and task contracts for normal specialization;
- reserve same-name project agent definitions for deliberate full shadowing, or use a distinct role name when specialization is substantial;
- validate with the deterministic matrix in `docs/research/2026-08-03-agent-archetype-trajectories.md` before applying stronger global budgets.

No second owner is introduced: `pi-subagents` remains the conversational delegation owner and `automation/` remains the deterministic evaluation owner.

Rollback:

- restore the previous three files under `pi/agent/agents/`;
- re-run the apply script only after prompt evals pass.

## References

- Agent archetype trajectories: `docs/research/2026-08-03-agent-archetype-trajectories.md`
- Package shortlist: `docs/research/2026-08-02-pi-package-shortlist.md`
- Package policy: `docs/decisions/0005-package-adoption-policy.md`
- Initial shortlist decision: `docs/decisions/0006-initial-package-shortlist.md`
- Remote/mobile decision: `docs/decisions/0002-local-homelab-mobile-operating-model.md`
