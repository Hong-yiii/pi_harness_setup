# Pi Harness Workflow Manual

Status: Draft
Last updated: 2026-08-03

## What This Harness Is

This repo is the rebuildable source of truth for a personal Pi setup. Pi stays the upstream base. The repo adds the workflow around it: package choices, runbooks, prompts, user config templates, remote access notes, and decision records.

The current north star is:

- use Pi locally and on a homelab,
- keep long-running sessions durable,
- control work from a Mac, terminal, and eventually phone,
- use worktrees and subagents for parallel work,
- keep orchestration explicit and observable,
- document decisions before adding more authority.

## The Operating Loop

Use this loop when changing the harness itself:

1. Capture the idea in `docs/reviews/current-plan-review.md`.
2. Classify it as `Decided`, `Leaning`, `Trial`, `Open`, or `Rejected`.
3. Name the surface it affects: web/search, code exploration, read/edit, plan mode, worktrees, subagents, orchestration, observability, remote/mobile, UI, or safety.
4. Check surface ownership so one feature does not quietly become two competing owners.
5. Add install, rollback, smoke-test, and trust notes.
6. Execute the batch.
7. Update the runbook and decision doc with what actually happened.

Use this loop when working inside a normal project:

1. Start Pi from the project root.
2. Read the local `AGENTS.md` and nearby context docs.
3. Use `/plan` when the change is risky or ambiguous.
4. Use `pi-lens` and `rg` for code exploration.
5. Use `pi-subagents` for bounded scout/research/review tasks.
6. Create a native Git worktree before starting each independent implementation lane.
7. Put repeated routing or evaluation logic under `automation/`; keep it out of normal sessions.
8. Write back decisions, runbooks, or findings before the context evaporates.

## Current Lean Profile

The reusable profile is in `pi/package-profiles/lean-default.json`. The older
`initial-local.json` records the discovery batch and is no longer the target.

Installed user-level packages:

- `pi-observability`: first local observability/status layer.
- `pi-web-access`: web search and fetch surface.
- `pi-lens`: code exploration and graph/index trial.
- `pi-subagents`: day-to-day subagent owner.
- `@dietrichgebert/ponytail`: implementation/review taste layer.
- `pi-background-tasks@0.6.0`: focused background commands and completion notifications.

Explicitly out for now:

- Usher,
- OMP,
- `context-mode`,
- Plannotator,
- hashline/read replacement packages,
- extra sidebar/status packages.
- dynamic workflows and phone UI.

## When To Use What

| Situation | Use | Avoid |
| --- | --- | --- |
| Broad research or package comparison | `pi-web-access`, researcher subagents, notes in `docs/research/` | Ponytail full/ultra narrowing the exploration too early |
| Understanding a codebase | `rg`, `pi-lens`, scout subagent | Installing read/edit replacement packages before `pi-lens` is understood |
| Risky change | `/plan`, review gate, small worktree | Editing main branch directly while uncertain |
| Independent implementation lane | native Git worktree, optionally created with `piwt` | Starting Pi in the root checkout or stacking worktree managers |
| Second opinion or code review | `pi-subagents` reviewer/scout/planner roles | Huge vague subagent tasks with no cap |
| Repeated loop with routing or evals | explicit code under `automation/` | Ambient workflow triggers in normal sessions |
| Small implementation/review cleanup | Ponytail `lite` | Ponytail during open-ended research if it becomes too terse |
| Long-running command | background task, then `/tasks` or bounded logs | Blocking the main conversation or polling constantly |
| Mac/remote interaction | Native `cmux ssh homelab` | TUI nesting, public listeners, or multiple daily controllers |
| Phone interaction | cmux iOS companion through the Mac; SSH/Mosh + tmux fallback | Assuming direct iOS-to-Linux support before it is documented |

## Subagents Vs Repo-Owned Automation

`pi-subagents` is for day-to-day delegation. Ask for a scout, researcher, planner, worker, or reviewer when the task can be isolated and summarized back.

Repo-owned automation is for loops where routing, budgets, retries, evaluation,
and outputs should be deterministic and reviewable. It lives under
`automation/` and runs only when explicitly invoked.

Rule of thumb:

- If you want a second pair of eyes, use `pi-subagents`.
- If you can write the inputs, stop conditions, and scoring rule, build an explicit runner under `automation/`.
- Do not install an orchestrator because one task happens to contain several steps.

## Worktrees

Worktrees are mandatory for parallel workflows. Use them when:

- two agents may edit the same project independently,
- you want to try a branch without dirtying the main checkout,
- you are comparing implementations,
- a workflow may spawn editing agents.

Use persistent sibling worktrees for PR lanes. Start Pi only after entering the
real worktree so Pi, built-in tools, artifacts, and subagents receive the same
cwd. Keep the root checkout clean as a control plane, and keep one writer per
PR worktree. Read-only scouts and reviewers may share that lane.

The optional zsh helper is installed by the apply script:

```zsh
source ~/.config/pi_harness_setup/piwt.zsh
piwt feat/auth origin/main
```

`piwt <branch> [base]` defaults `base` to `HEAD`, creates a sibling directory
named `<repo>-<branch-with-slashes-replaced>`, changes into it, and starts Pi.
It intentionally does not auto-remove the worktree. After the PR is merged or
abandoned:

```bash
cd /path/to/original/repo
git worktree list
git worktree remove ../repo-feat-auth
git branch -d feat/auth
```

For multiple active PRs, run one Pi session from each persistent worktree.
Only let `pi-subagents` create temporary child worktrees when parallel writers
are explicitly requested with `worktree: true`; integrate their patches before
cleanup. Do not stack that mode with another worktree manager.

## Plan Mode

Plan mode remains the simple bundled plan-mode extension. Use it for:

- exploration before changing files,
- risky setup,
- ambiguous refactors,
- reviewing remote/mobile/security changes.

Plannotator stays out until we decide we need a richer plan UI.

## Ponytail

Ponytail defaults to `lite`.

Good use:

- implementation,
- review,
- pruning unnecessary abstraction,
- small diff discipline.

Bad use:

- early research,
- package discovery,
- situations where breadth matters more than minimality.

## Remote And Mobile

The normal architecture is:

```text
native cmux on Mac
  -> SSH/Tailscale
  -> Linux cmuxd-remote detachable PTY
  -> project shell and Pi
```

Use the native workspace as the organizational and lifecycle boundary. Linux
owns the process while macOS retains native panes, browser routing, Feed, and
notifications. Transport drops reconnect to the same remote PID and terminal
state.

Fallback only:

```text
Mac -> cmux Remote tmux -> homelab tmux -> Pi
phone terminal -> Tailscale -> SSH or Mosh -> homelab tmux -> Pi
```

The Ubuntu harness checkout lives at `~/pi_harness_setup`. Bootstrap and
operate it with `docs/runbooks/ubuntu-homelab-setup.md`; credentials and Pi
session files stay on that host rather than syncing through Git.

Open the homelab from a terminal inside native cmux:

```bash
cmux ssh homelab
```

Then change to the project and start Pi normally. Each invocation creates one
native remote workspace; `--name` and `--command` are optional conveniences.

Daily use and implementation details are in
`docs/runbooks/cmux-ssh-remote.md`. Remote tmux remains available only for
existing fallback sessions.

`pi-phone` and Usher are not in the default.

## Skill Shelf

Pi keeps seven general skills: `diagnose`, `caveman`, `grill-with-docs`,
`handoff`, `to-prd`, `to-issues`, and `zoom-out`.

The shared files remain under `~/.agents/skills`; Pi filters its own discovery,
so Codex and other agents are unaffected. Pi Lens injects four additional
tool-specific guides internally. Those remain while Pi Lens owns advanced code
exploration. `zoom-out` is manual-only by design, so it appears as a skill
command but not in the model's automatic skill catalog.

## Vim And Mouse-Friendly TUI Basics

The goal is not to become a Vim purist. The goal is to move confidently in TUIs while keeping mouse, Mac shortcuts, and visual affordances.

Layer the controls:

- cmux: Mac workspaces, panes, browser, notifications.
- tmux: durable remote sessions, pane/window survival, phone fallback.
- Vim/Neovim: editing and TUI-native navigation.

Learn first:

- `h/j/k/l`: left/down/up/right,
- `/`, `n`, `N`: search and repeat search,
- `Ctrl+d`, `Ctrl+u`: half-page down/up,
- `gg`, `G`: top/bottom,
- `w`, `b`, `e`: word movement,
- `u`, `Ctrl+r`: undo/redo,
- `ci"`, `daw`, `.`: text object change/delete/repeat.

Keep mouse mode on in tmux. Use Neovim on machines you control, and plain Vim literacy for minimal servers.

## Rebuild And Verification

Apply the user-level profile with:

```bash
node scripts/apply-pi-setup.mjs
```

Package initialization is documented in `docs/runbooks/initialize-packages.md`.

Core checks:

```bash
pi --version
pi list --approve
npm audit --prefix ~/.pi/agent/npm --omit dev
~/.pi/agent/npm/node_modules/.bin/ast-grep --version
~/.pi/agent/npm/node_modules/.bin/pi-lens build-graph --cwd "$PWD"
pi --approve --no-session --thinking minimal -p "Reply with exactly: harness-smoke-ok"
```

Known local adjustment:

- Pi's bundled example `subagent` symlink was disabled because it conflicts with `pi-subagents`.
- Restore only after removing `pi-subagents`.

## Files To Know

| File | Purpose |
| --- | --- |
| `AGENTS.md` | How future agents should navigate this repo. |
| `CONTEXT.md` | Current mental model and vocabulary. |
| `scratchpad.md` | Unsettled thoughts and working notes. |
| `docs/reviews/current-plan-review.md` | Build/config gate. |
| `docs/decisions/` | Durable choices and tradeoffs. |
| `docs/research/` | Research syntheses and source notes. |
| `docs/runbooks/` | Rebuild and operations instructions, including Ubuntu homelab setup. |
| `pi/agent/` | Versioned Pi user-level guidance/assets. |
| `pi/package-profiles/` | Package profiles and install rationale. |
| `pi/user-config/` | Templates for user-level config stored outside the repo. |
