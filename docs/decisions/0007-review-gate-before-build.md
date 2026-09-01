# 0007: Review Gate Before Build

Date: 2026-08-02

## Status

Accepted

## Decision

Use `docs/current-plan.md` as the living gate before meaningful build/configuration passes.

Ideas should accumulate there first. Implementation happens in reviewed batches, not one-off package installs or ad hoc config edits.

## Rationale

The harness is meant to be reproducible and understandable. Pi packages can affect tools, prompts, lifecycle events, UI, remote control, and session state. A review gate keeps the setup from drifting into an opaque pile of individually reasonable choices.

The review document should capture:

- what changed in the plan,
- which surface each idea touches,
- whether the idea is decided, leaning, trial, open, or rejected,
- what conflicts it may have,
- what a build batch contains,
- what must be true before the batch runs.

## Consequences

- Agents working in this repo must consult the current plan review before implementing harness changes.
- New package ideas should be added to the review document before installation.
- Build batches should include rollback and smoke-test notes.
- The review doc is allowed to be messy while thinking is active, but a batch must be made crisp before it is implemented.
