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
- `scripts/`: idempotent setup helpers, including the checksum-pinned Ubuntu bootstrap.
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

## Ubuntu Homelab

The remote runtime uses the same lean profile with host-local credentials and
sessions:

```bash
git clone https://github.com/Hong-yiii/pi_harness_setup.git ~/pi_harness_setup
cd ~/pi_harness_setup
bash scripts/bootstrap-ubuntu-homelab.sh
export PATH="$HOME/.local/bin:$PATH"
node scripts/apply-pi-setup.mjs
tmux new-session -d -s pi-main -c "$HOME/pi_harness_setup"
```

The validated fallback remains native cmux Remote tmux:

```bash
cmux ssh-tmux homelab
```

The current thin-client trial instead lets cmux TUI own disposable remote
workspaces on Linux:

```bash
npx --yes cmux@0.11.0 remote ssh homelab --session agents-pilot
```

Start Pi inside the remote `agents-pilot` TUI only for disposable pilot work:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/pi_harness_setup
pi
```

Until daemon crash, reboot, version-skew, and UX tests pass, keep established
work in the tmux-owned `pi-main` session.

The bootstrap may need interactive sudo for tmux. Complete Pi `/login`
separately over SSH; never copy auth files into the repository. See
`docs/runbooks/ubuntu-homelab-setup.md` for the end-to-end procedure and
rollback.

Use `docs/runbooks/cmux-tui-remote.md` for the thin-client workflow and
implementation. `docs/runbooks/cmux-setup.md` retains native Mac cockpit and
Remote tmux fallback details.
