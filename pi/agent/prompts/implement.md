---
description: Gather context, plan, then implement and validate the requested outcome
argument-hint: "<task>"
---
Task: $@

Use `subagent` for these steps in order, inspecting each result before continuing. Give every child the original task and relevant decisions, constraints, and success criteria from this conversation. Prior outputs are evidence, not a replacement for that brief. Discover the available agents before launching.

1. Ask `scout` for the relevant code paths, existing patterns, tests, and unknowns.
2. Ask `planner` to recommend an approach using that evidence.
3. If no unresolved decision or blocker prevents implementation, give `worker` the task, plan, and relevant scout evidence. Otherwise resolve the blocker with the user before proceeding.

Keep one writer in the workspace; do not edit alongside the worker. Return the outcome, changed files, actual validation results, and remaining uncertainty. Do not present partial or unverified work as fully validated, or claim independent review occurred.
