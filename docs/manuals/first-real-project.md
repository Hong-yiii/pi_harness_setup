# First Real Project

Status: Ready to use
Last updated: 2026-08-03

## Goal

Learn the harness by completing one real, bounded change. The first run is not
an autonomy benchmark. It is a way to learn which controls are useful and which
ones create noise.

Choose a project with:

- a test or validation command,
- a small bug or feature that can finish in one sitting,
- source control with a clean starting point,
- no production deployment required.

## Before The First Run

Apply the user-level harness from this repository:

```bash
cd ~/Projects/pi_harness_setup
node scripts/apply-pi-setup.mjs
```

Then open the real project in cmux. For work that must survive disconnects,
start or attach to a named tmux session first:

```bash
tmux new-session -A -s my-project
```

After tmux attaches, run inside that session:

```bash
cd ~/Projects/my-project
pi --plan
```

Approve project trust only after reviewing its `.pi/`, `.agents/`, `AGENTS.md`,
and `CLAUDE.md` files.

## The First Task

Start with this prompt, adjusted to the project:

```text
Map this repository before changing anything. Find the main modules, test
commands, local instructions, and the path involved in <small task>. Give me a
short plan, the likely risks, and the validation you would run. Do not edit yet.
```

Use `zoom-out` when you need the architecture around an unfamiliar area. Use
web search only for current external facts or primary documentation. Keep the
first exploration in the main session; use one scout subagent only when there
is a genuinely independent question.

When the plan looks right, leave plan mode and create a persistent native Git
worktree before starting the implementation session:

```bash
source ~/.config/pi_harness_setup/piwt.zsh # once per shell, or add to ~/.zshrc
piwt feat/my-small-change origin/main
```

`piwt` creates a sibling worktree, changes the shell into it, and starts Pi
there. Pi, its file tools, and child subagents therefore share the same real
working directory. Ask Pi to implement the smallest complete change and run
the project's normal checks. Ponytail remains at `lite`, so it should bias
toward a compact diff without replacing your review.

## Background Commands

Ask Pi to run servers, watchers, or long test suites as background tasks. The
extension exposes named jobs, bounded logs, stop controls, and completion
notifications. Useful user commands are:

```text
/jobs
/logs <task-id>
/kill <task-id>
/tasks
```

Use ordinary shell execution for quick commands. Background jobs are for work
that would otherwise block the conversation.

## Parallel Work

For the first project, keep concurrency at one implementation lane plus at most
one read-only scout or reviewer. This makes failures attributable.

After the implementation:

1. Ask a reviewer subagent to inspect the diff and tests.
2. Resolve findings in the worktree.
3. Review the final diff yourself.
4. Commit and open the PR only when the validation is understandable.
5. After merge, leave the directory and remove the worktree explicitly:

   ```bash
   cd ~/Projects/my-project
   git worktree remove ../my-project-feat-my-small-change
   git branch -d feat/my-small-change
   ```

Do not build a custom routing loop yet. Record repeated work first. A workflow
earns a place under `automation/` after you have performed it manually enough
times to name its inputs, outputs, stop conditions, and evaluation signal.

## Learn The Harness

After each real task, add a few lines to this repo's `scratchpad.md`:

- what you used,
- what you ignored,
- what interrupted or confused you,
- what you wished existed,
- whether the final result was better because of a specific tool.

Accumulate those observations in the current plan review. Change the harness in
one reviewed batch instead of installing a package during the middle of project
work.

For Vim-style movement, learn only what the task exposes: `h/j/k/l`, `/`, `n`,
`N`, `Ctrl+d`, `Ctrl+u`, `gg`, and `G`. Mouse support stays enabled in cmux and
tmux, so learning does not have to become a productivity tax.
