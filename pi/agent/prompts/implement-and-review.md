---
description: Delegate implementation, review it, then apply review feedback
argument-hint: "<task>"
---
Use the subagent tool with the chain parameter:

1. Run `worker` to implement: $@
2. Run `reviewer` to review the implementation using `{previous}`.
3. Run `worker` to apply necessary review feedback using `{previous}`.

Return the final result and mention changed files.
