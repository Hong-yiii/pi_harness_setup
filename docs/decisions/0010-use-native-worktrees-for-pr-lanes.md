# 0010: Use Native Worktrees For PR Lanes

Date: 2026-08-04
Status: Accepted

## Decision

Remove `@season179/pi-worktree` from the lean Pi profile. Create persistent
worktrees with Git before starting Pi, then run one Pi session from each real
worktree directory.

Use `piwt <branch> [base]` as the optional zsh convenience function. Git owns
persistent PR worktrees. `pi-subagents` may own temporary child worktrees only
when a parallel run explicitly sets `worktree: true`.

## Why

`@season179/pi-worktree` creates a real Git worktree but keeps Pi's logical
`ctx.cwd` at the original checkout. It redirects selected built-in tools into
the generated worktree. Custom tools such as `subagent` still receive the
original cwd, so child sessions, artifacts, and parent file tools can resolve
the same path differently.

Starting Pi after `cd` into a native worktree avoids that split:

```text
process cwd = Pi ctx.cwd = tool root = subagent cwd
```

Persistent sibling worktrees also fit concurrent PR work better than temporary
sessions based only on `main` or `master`.

## Consequences

- The root checkout is a clean control plane, not a shared writer workspace.
- Each active PR gets a sibling directory, branch, Pi session, and one writer.
- Read-only scouts and reviewers may share a PR worktree.
- Parallel child writers require explicit `pi-subagents` worktree isolation and
  explicit patch integration.
- `piwt` does not remove worktrees automatically; cleanup remains an explicit
  Git operation after a PR is merged or abandoned.

## Rollback

Re-add a pinned worktree package to `pi/package-profiles/lean-default.json`,
restore its managed-package entry in the setup policy if removed, rerun the
apply script, and document which subagent workflows are prohibited while its
path redirection is active.
