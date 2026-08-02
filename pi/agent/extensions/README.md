# Extensions

This directory documents extension choices that should exist in `~/.pi/agent/extensions`.

## Current Local Experiment

The current live machine uses symlinks to Pi's bundled example extensions:

```bash
~/.pi/agent/extensions/plan-mode -> <pi package>/examples/extensions/plan-mode
~/.pi/agent/extensions/subagent  -> <pi package>/examples/extensions/subagent
```

These are useful for learning, but they are not yet a committed/pinned harness dependency.

## Candidate Stable Choices

- Plan mode: evaluate community plan-mode packages versus a local extension.
- Subagents: evaluate `pi-subagents` versus the bundled example.
- Observability: evaluate `pi-otel`, `@jademind/pi-telemetry`, Sentry, and LangSmith.
- MCP: evaluate `pi-mcp-adapter` after deciding tool/security boundaries.

## Rule

If an extension becomes core to the harness, record:

- source,
- version or commit,
- install command,
- config,
- threat model,
- rollback command.
