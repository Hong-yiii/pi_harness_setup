# 0005: Package Adoption Policy

Date: 2026-08-02

## Status

Draft

## Decision

Adopt Pi packages in profiles rather than all at once:

- `base`: small set of high-confidence packages needed almost every session.
- `research`: web/search/context/code-exploration tools.
- `parallel`: subagents, worktrees, orchestrators.
- `remote`: phone/web/tmux/status surfaces.
- `experimental`: high-upside packages under active evaluation.

No package moves to `base` until it has:

- install command,
- version/pin strategy,
- source link,
- trust notes,
- maturity/support notes,
- rollback command,
- fit statement,
- smoke test.

## Rationale

The Pi package ecosystem moves quickly. A package can execute code, inject prompts, register tools, alter UI, and intercept lifecycle events. Profiles let us test powerful packages without making every session inherit their full behavior.

## Consequences

- The harness repo should gain profile docs/scripts before bulk installs.
- Package research should include a "profile" recommendation.
- Package research should include credibility, popularity, maturity, support, dependency, and license notes.
- Worktree/subagent packages may land in `parallel` before they land in `base`.
