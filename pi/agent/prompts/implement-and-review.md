---
description: Implement, independently review, and apply justified fixes with a final review
argument-hint: "<task>"
---
Task: $@

Use parent-controlled `subagent` calls. Give every child the original task and relevant decisions, constraints, and success criteria from this conversation. Discover the available agents before launching. Keep one writer in the workspace; do not edit alongside a worker. Record the starting change state so review can distinguish pre-existing work.

1. Ask `worker` to implement and validate the task. Inspect its result; resolve blockers before proceeding rather than treating partial work as complete.
2. Ask a fresh-context `reviewer` to inspect the actual changes against the original task. Supply the starting change state, worker report, changed paths, validation evidence, and any acceptance metadata available. Review must not rely solely on the worker's summary.
3. Assess the findings. If fixes are justified and within scope, give `worker` the original brief, implementation context, and accepted findings for one correction pass. Resolve any new product, architecture, or authority decision with the user rather than silently expanding scope.
4. If changes were made after review, run a fresh review of the resulting changes with the same original brief and updated evidence. If actionable findings remain, report them rather than entering an automatic repair loop.

Return what changed, actual validation results, review findings and their disposition, and remaining uncertainty. Do not claim approval if review was blocked or incomplete.
