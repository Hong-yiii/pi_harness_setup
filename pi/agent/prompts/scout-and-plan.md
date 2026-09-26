---
description: Gather local code context, then produce a grounded plan without implementing
argument-hint: "<task>"
---
Task: $@

Use `subagent` for these steps in order. Give each child the original task and relevant decisions, constraints, and success criteria from this conversation—not just the previous child's summary. Discover the available agents before launching.

1. Ask `scout` to map the code needed to understand the task, with evidence and unknowns.
2. Inspect the result. If a blocker prevents planning, report it; otherwise give `planner` the task and scout findings to recommend an approach and validation.

Keep both steps read-only. Return the plan and any decisions needed before implementation. Do not implement.
