# Pi Harness Setup

Personal, reproducible setup notes for using the Pi coding agent locally, on a remote homelab, and from a phone.

This repo is the source of truth for:

- Pi configuration and portable workflow assets.
- Research on how people customize Pi.
- High-level decisions about local, homelab, observability, terminal, and mobile access.
- Runbooks to recreate the harness from a fresh machine.

## Current Shape

- `pi/agent/`: versioned Pi user-level settings, agents, prompts, and global guidance.
- `docs/research/`: source notes and synthesis from docs, blogs, packages, and community examples.
- `docs/decisions/`: durable choices and tradeoffs.
- `docs/manuals/`: user-facing operating manuals for the harness.
- `docs/reviews/`: living plan review and build-batch gate.
- `docs/runbooks/`: rebuild and operations instructions.
- `pi/package-profiles/`: selected package profiles and excluded-package rationale.
- `pi/user-config/`: reproducible templates for user-level package settings that Pi stores outside the repo.
- `skills/`: the pinned seven-skill shelf shared through `~/.agents/skills`.
- `automation/`: explicit routing, loops, and evals that do not load in normal sessions.
- `scripts/`: idempotent setup helpers.
- `terminal/`: cmux, Ghostty, and tmux templates for the terminal/control surface.
- `scratchpad.md`: live comparison notes while the setup is still taking shape.

## First Principles

1. Keep Pi itself minimal; version the harness around it.
2. Prefer portable assets first: `AGENTS.md`, prompt templates, skills, agents, and settings.
3. Add extensions only when behavior must be enforced or observed.
4. Treat local and homelab as two runtimes for the same harness.
5. Phone access should attach to durable sessions, not run fragile local mobile workflows.
6. Observability is part of the harness, not an afterthought.
7. Accumulate ideas in the current plan review, then build in reviewed batches.

## Quick Start

```bash
cd ~/Projects/pi_harness_setup

# Install Pi if needed.
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@0.83.0

# Install the selected skills/packages and merge the Pi user config.
node scripts/apply-pi-setup.mjs
```

The script preserves unrelated Pi settings and packages, backs up changed user
config, installs pinned package versions, applies the Pi-only skill allowlist,
and installs the plan-mode and cmux hooks when available. It also publishes the
optional `piwt` zsh helper. Enable it with:

```zsh
source ~/.config/pi_harness_setup/piwt.zsh
```

Use `piwt <branch> [base]` to create a persistent sibling Git worktree, enter
it, and start Pi with one real cwd shared by tools and subagents. See
`docs/manuals/pi-harness-workflow-manual.md` for examples and cleanup.

Start learning the setup on a real codebase with
`docs/manuals/first-real-project.md`.

The first cmux/tmux/Neovim setup has also been executed locally. See `docs/runbooks/cmux-setup.md` for the live config paths, backups, and pending homelab checks.
