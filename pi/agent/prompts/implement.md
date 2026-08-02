---
description: Scout, plan, then delegate implementation to an isolated worker
argument-hint: "<task>"
---
Use the subagent tool with the chain parameter:

1. Run `scout` to find all code relevant to: $@
2. Run `planner` to create an implementation plan for "$@" using `{previous}`.
3. Run `worker` to implement the plan using `{previous}`.

Return the worker's final result and mention changed files.
