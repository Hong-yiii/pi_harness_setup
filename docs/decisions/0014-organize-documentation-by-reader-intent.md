# 0014: Organize Documentation By Reader Intent

Date: 2026-08-30
Status: Accepted

## Decision

Organize the documentation around what a reader is trying to do:

- `docs/getting-started/` for installation and first-use paths;
- `docs/guides/` for task-oriented daily use;
- `docs/operations/` for setup, maintenance, recovery, and package procedures;
- `docs/reference/` for dated research and comparisons;
- `docs/decisions/` for durable ADR-style records;
- `docs/history/` for executed plans and trial evidence.

Keep `docs/README.md` as the human documentation index and
`docs/current-plan.md` as the active review gate. Put short agent-routing hints
inside the human-readable indexes rather than maintaining a separate parallel
documentation tree.

## Rationale

The previous manuals, runbooks, research, reviews, and trials taxonomy described
how documents were produced. New readers had to understand that taxonomy before
they could find the right page. It also placed the active review gate beside an
executed rollout plan.

A reader-intent structure makes onboarding and normal tasks visible while still
preserving the repository's bookkeeping role. Decisions retain chronology;
reference material retains dates and sources; history retains evidence even
when a workflow is rejected or superseded.

## Consequences

- Existing documentation links must follow moved files.
- Active instructions live only in getting-started, guides, and operations.
- Reference and history are evidence, not current policy.
- Human indexes provide concise routing hints for agents.
- New categories should not be added until repeated navigation failures justify
  them.

## Validation

- `docs/README.md` provides a path for installation, daily use, operations,
  current state, decisions, research, and history.
- No tracked documents remain under the previous manuals, runbooks, research,
  reviews, or trials directories.
- Repository Markdown links resolve after migration.
