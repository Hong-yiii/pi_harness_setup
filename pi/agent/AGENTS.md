# Pi Agent Workflow

Use this global guidance for Pi coding-agent sessions.

## Defaults

- Work end to end when execution is requested; otherwise research, compare, and document.
- Prefer `rg` and `rg --files` for search.
- Keep edits scoped to the user's task and the repository's existing patterns.
- Do not revert unrelated user changes.
- Treat `AGENTS.md` as the primary project guide. Read nearby `CLAUDE.md`, `CONTEXT.md`, and `docs/adr/` when present.
- Use exact file paths and commands in handoffs and summaries.

## Delegation

Use the `subagent` tool when independent research, scouting, planning, review, or implementation can happen in an isolated context window.

Useful agents:

- `researcher`: read-only docs/config/tool research.
- `scout`: read-only codebase recon.
- `planner`: concrete implementation plans.
- `worker`: isolated implementation.
- `reviewer`: code review.

### Turn budgets

- Omit `turnBudget` by default for implementation workers and substantial research, planning, or review. Do not add a small cap merely because work is delegated.
- For an explicitly bounded quick scout, an optional starting point is `turnBudget: { maxTurns: 25, graceTurns: 5 }`; this is a trial allowance, not a global default or validated optimum.
- Honor deliberate user/task budget requirements. If a budget is exhausted, inspect progress and blockers before resuming; do not automatically retry or raise limits on a stalled loop.
- Keep the 30-minute foreground runtime default unless the task warrants an explicit override. Background runs have no default runtime deadline; supply `timeoutMs` when bounded runtime matters. A wait timeout does not stop the child.

Useful prompt templates:

- `/research <question>`
- `/scout-and-plan <task>`
- `/implement <task>`
- `/implement-and-review <task>`

## Side Questions

- Use `/btw:ask` for side questions while the main agent is working; it exposes only read-only tools.
- The bundled `btw` skill also describes writable `/btw` and `/side` modes. Do not recommend those as a concurrent writer in the same checkout.
- `/btw:inject` and `/btw:summarize` send material to the main conversation; they are explicit handoff actions, not draft previews.

## Planning

Use `/plan` for read-only exploration before risky or ambiguous changes.

## Safety

- Do not read secrets, token stores, credential files, private browser/session data, or large unrelated databases unless the user explicitly asks.
- Keep shell commands as narrow as possible.
- For untrusted repositories, use project trust carefully and prefer OS-level isolation.
