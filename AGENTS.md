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

## For Agents Adapting This Harness

This repository records one person's working harness, not a universal machine
specification. Treat its macOS workstation, Ubuntu x86_64 homelab, Tailscale,
cmux, and phone workflow as a tested reference architecture—not assumptions
about the next user's environment.

Before changing or applying the harness for someone else:

1. Read `README.md` for purpose and repository shape.
2. Read `CONTEXT.md` for current choices, preferences, and open questions.
3. Read `docs/reviews/current-plan-review.md` for accepted, trial, deferred, and
   rejected work.
4. Read the relevant `docs/decisions/` before replacing an established owner,
   then use `docs/runbooks/` only for the parts that match the target system.
5. Inventory the new user's OS, architecture, package manager, existing Pi
   configuration, terminal, network boundaries, and whether remote/mobile use
   exists at all.

A local-only user does not need the homelab, cmux SSH, tmux durability, Tailscale,
or mobile layers. A different server OS or CPU must not run the Ubuntu x86_64
bootstrap unchanged. Reuse the portable Pi assets and package profile first;
adapt host-specific scripts and runbooks only after documenting the new target
and validating it there. Never copy this owner's credentials, sessions, machine
state, or private paths to another installation.

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
