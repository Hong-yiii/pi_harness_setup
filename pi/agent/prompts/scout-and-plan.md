---
description: Delegate read-only recon to scout, then ask planner for a concrete plan
argument-hint: "<task>"
---
Use the subagent tool with the chain parameter:

1. Run `scout` on: $@
2. Run `planner` on the same task using the scout result via `{previous}`.

Do not implement. Return the final plan.
