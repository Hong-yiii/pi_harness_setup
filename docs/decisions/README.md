# Decisions

Numbered ADR-style records preserve durable choices and their tradeoffs. Status belongs to each record; superseded decisions remain here because they explain how the harness evolved.

## Current Decisions To Read First

- [`0009`](0009-adopt-lean-default-and-separate-automation.md) — lean default package ownership and explicit automation boundary.
- [`0010`](0010-use-native-worktrees-for-pr-lanes.md) — native Git worktrees for persistent PR lanes.
- [`0011`](0011-use-shared-harness-with-host-local-linux-runtime.md) — shared harness with host-local runtime state; partly superseded only for the Mac control plane.
- [`0013`](0013-adopt-native-cmux-ssh-as-primary-homelab-control-plane.md) — native cmux SSH as the primary Mac-to-homelab path.
- [`0014`](0014-organize-documentation-by-reader-intent.md) — human-first documentation organized by reader intent.

## Decision Log

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-repo-purpose-and-shape.md) | Repository purpose and shape | Superseded in part by ADR 0014 |
| [0002](0002-local-homelab-mobile-operating-model.md) | Local, homelab, and mobile model | Superseded in part by ADR 0013 |
| [0003](0003-research-first-then-install.md) | Research before broad installation | Accepted |
| [0004](0004-base-harness-upstream-pi-with-omp-trial.md) | Upstream Pi base; separate OMP trial | Accepted |
| [0005](0005-package-adoption-policy.md) | Package adoption policy | Draft |
| [0006](0006-initial-package-shortlist.md) | Initial package shortlist | Superseded by ADR 0009 |
| [0007](0007-review-gate-before-build.md) | Review gate before build | Accepted |
| [0008](0008-initialize-selected-pi-packages.md) | Initial local package installation | Superseded by ADR 0009 and ADR 0010 |
| [0009](0009-adopt-lean-default-and-separate-automation.md) | Lean default and separate automation | Accepted |
| [0010](0010-use-native-worktrees-for-pr-lanes.md) | Native worktrees for PR lanes | Accepted |
| [0011](0011-use-shared-harness-with-host-local-linux-runtime.md) | Shared harness with host-local Linux runtime | Superseded in part by ADR 0013 |
| [0012](0012-adopt-cmux-remote-tmux-as-primary-homelab-control-plane.md) | cmux Remote tmux control plane | Superseded by ADR 0013 |
| [0013](0013-adopt-native-cmux-ssh-as-primary-homelab-control-plane.md) | Native cmux SSH control plane | Accepted |
| [0014](0014-organize-documentation-by-reader-intent.md) | Documentation organized by reader intent | Accepted |

For current operational state, consult [`../current-plan.md`](../current-plan.md). An accepted ADR explains a durable choice; it does not replace the relevant guide or operation.

> **Agent hint:** read the ADR for the surface you are changing before replacing its active owner. Add a new ADR when a durable choice changes; do not rewrite superseded rationale out of history.
