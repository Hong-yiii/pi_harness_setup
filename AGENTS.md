# Agent Navigation Guide

This repo documents and reconstructs a personal Pi coding-agent harness.

## How To Work Here

- Start with `README.md` for repo purpose and shape.
- Use `CONTEXT.md` for the current mental model and vocabulary.
- Use `scratchpad.md` for unsettled ideas, comparisons, and active questions.
- Use `docs/reviews/current-plan-review.md` as the review gate before meaningful build/configuration passes.
- Put durable choices in `docs/decisions/` as ADR-style notes.
- Put current research synthesis in `docs/research/`.
- Put rebuild steps in `docs/runbooks/`.
- Put versioned Pi assets under `pi/agent/`.
- Keep the selected cross-agent skill sources under `skills/`; the apply script publishes them to `~/.agents/skills`.
- Put deterministic routing, loops, and evals under `automation/`; do not load them into ordinary interactive Pi sessions.

## Research Rules

- Prefer primary sources and concrete examples over generic opinions.
- Separate observed facts, strong inferences, and personal preferences.
- Keep links next to the claims they support.
- Mark anything we have not tested locally or on the homelab as `Untested`.

## Configuration Rules

- Never commit credentials, API keys, OAuth tokens, private session logs, browser data, or machine-private paths that are not required to rebuild the harness.
- Store templates and documented commands rather than raw secrets.
- If a file should be copied into `~/.pi/agent`, mirror its relative path under `pi/agent/`.
- If behavior must be enforced, prefer a Pi extension over a prompt-only instruction.
- Before installing packages or making substantial harness changes, update `docs/reviews/current-plan-review.md`, identify the affected surface, and confirm the change belongs in the next reviewed build batch.
- Prefer one active owner per high-authority surface: web/search, code exploration, read/edit, plan mode, worktrees, subagents, orchestration, observability, remote/mobile, and UI.
- Do not add a project-local `.pi/` package profile here; it would duplicate the user-level harness while working on this repo. The reusable profile is `pi/package-profiles/lean-default.json` and is applied by `scripts/apply-pi-setup.mjs`.
- Keep notes, research, reviews, and decisions outside Pi resource-discovery directories so they do not become ambient context.

## Target Environment

- Local machine: macOS workstation.
- Remote: homelab reachable over private networking.
- Mobile: phone as a control surface for existing sessions.
- Terminal baseline: tmux and/or cmux over private networking; vim/neovim learning path optional but encouraged.
