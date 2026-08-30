# Package Selection Intake

Date: 2026-08-02

## Raw Wishlist

The user asked for a chart of what to bring into upstream Pi, including:

- advanced tooling for code exploration,
- basic tools beyond shipped Pi,
- web search,
- better UI,
- plan mode,
- `pi install npm:context-mode`,
- `https://pi.dev/packages/@dietrichgebert/ponytail`,
- worktrees as a must-have for parallel workflows,
- remote use from a Linux home box on Tailscale, not only laptop,
- maybe something called `usher`,
- subagents,
- two loop modes:
  1. deterministic loops/evals/routing written by the user using the coding agent,
  2. orchestrator-handled loop engineering, similar to Claude Code or Codex, possibly `https://pi.dev/packages/@quintinshaw/pi-dynamic-workflows`,
- additional suggestions from research.

## User-Fit Lens

Score packages against these priorities:

1. **Research-first:** makes exploration and comparison better, not just autonomous writes.
2. **Parallel-first:** supports subagents and worktree isolation.
3. **Reproducible:** can be documented and recreated from this repo.
4. **Observable:** exposes cost, tokens, progress, status, traces, logs, or artifacts.
5. **Remote-friendly:** works over SSH/tmux/Tailscale and does not assume laptop-only GUI.
6. **Auditable:** narrow dependencies, clear source, simple rollback.
7. **Composable:** does not silently take over the whole harness.

## Initial Buckets

- **Core candidate:** likely belongs in the base after audit.
- **Trial candidate:** likely useful, but install only in a branch/trial profile first.
- **Debate:** high upside and high risk/uncertainty.
- **Avoid for now:** too broad, duplicate, or not yet relevant.

## Open Questions For This Pass

- Does `context-mode` overlap or conflict with Pi's native compaction/session model?
- Does Ponytail help the user's taste, or fight exploratory/prototype work?
- Should worktree isolation come from `pi-subagents`, `pi-dynamic-workflows`, or a smaller custom extension?
- Is `pi-dynamic-workflows` too much orchestrator too early, or exactly the missing Claude-Code-style loop layer?
- Is phone/remote control better solved by terminal/tmux first or a Pi web/phone package?
- What is "usher" exactly in the Pi ecosystem, and is it installable/auditable?
