# Extensions

This directory documents extension choices that should exist in `~/.pi/agent/extensions`.

## Shared Browser Client

`shared-browser/` is repository-owned source, published on both hosts by
`node scripts/apply-pi-setup.mjs --assets-only`. Its version is the reviewed Git
revision; it adds `/browser` and `shared_browser`, not another research owner.
Registration is inert. The separate Linux service owns Chrome and survives Pi
reloads and SSH loss; only the client lease and local viewer tunnel belong to Pi.

Configuration, threat model, acceptance evidence, and rollback live in
[`docs/operations/shared-browser.md`](../../../docs/operations/shared-browser.md)
and [ADR 0016](../../../docs/decisions/0016-use-a-service-owned-shared-browser.md).
Do not place private client configuration or browser state in this directory.

## Current Local State

The current live machine uses Pi's bundled plan-mode example:

```bash
~/.pi/agent/extensions/plan-mode -> <pi package>/examples/extensions/plan-mode
```

The bundled example `subagent` symlink was disabled because it conflicts with the selected user-level `pi-subagents` package:

```bash
~/.pi/agent/extensions.disabled/subagent.bundled-example.disabled-20260803 -> <pi package>/examples/extensions/subagent
```

## Candidate Stable Choices

- Plan mode: evaluate community plan-mode packages versus a local extension.
- Subagents: `pi-subagents` is the current user-level owner.
- Background commands: `pi-background-tasks@0.6.0` is pinned as the focused owner.
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
