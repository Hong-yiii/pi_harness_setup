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

Useful prompt templates:

- `/research <question>`
- `/scout-and-plan <task>`
- `/implement <task>`
- `/implement-and-review <task>`

## Planning

Use `/plan` for read-only exploration before risky or ambiguous changes.

## Safety

- Do not read secrets, token stores, credential files, private browser/session data, or large unrelated databases unless the user explicitly asks.
- Keep shell commands as narrow as possible.
- For untrusted repositories, use project trust carefully and prefer OS-level isolation.
