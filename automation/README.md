# Automation

This directory is for explicit, repo-owned agent automation:

- deterministic loops,
- model routing rules,
- eval cases and scoring,
- bounded fanout,
- resumable run state,
- reports that compare routes or prompts.

Nothing here is loaded into ordinary interactive Pi sessions. Run automation
through a script or command with explicit inputs, budgets, concurrency, and an
output directory.

Keep two concepts separate:

- `pi-subagents` handles conversational delegation inside an interactive task.
- `automation/` handles loops whose control flow and evaluation rules we own.

## cmux upgrade verification (trial)

`cmux-upgrade.mjs` is the first explicit workflow: baseline, candidate and
post-install **verification**, plus receipt comparison. It delegates to the
native browser-routing tests; it cannot install, restart, or approve an upgrade.
See [`../docs/operations/cmux-upgrade.md`](../docs/operations/cmux-upgrade.md)
for prerequisites, exact commands, remaining gates and cleanup. Native Mac
execution is **Untested**; hosted CI tests the harness only.
