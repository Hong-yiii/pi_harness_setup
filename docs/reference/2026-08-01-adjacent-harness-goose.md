# Adjacent Harness: Goose

Date: 2026-08-01

## Why This Exists

While researching "Pi agents with extensions versus OMP," one sidecar investigated Goose. Goose is not the direct answer to the Pi/OMP base decision, but it has useful design patterns for a personal harness.

## Transferable Ideas

- Agents as Markdown/config files with roles and model choices.
- Skills as reusable domain/task workflows.
- Recipes as repeatable parameterized workflows.
- Extensions as MCP-backed tool packages.
- Local logs and OpenTelemetry export as first-class observability.
- Remote serve/mobile access as a designed control surface, not an afterthought.
- Keep MCP servers disabled by default and enable them dynamically or per recipe.

## Why Not Adopt This Now

The current repo is specifically about a Pi harness. Introducing Goose as a primary candidate would widen scope too early.

## Keep For Later

Revisit Goose if:

- Pi/OMP remote control remains clumsy,
- first-class observability becomes more important than Pi compatibility,
- ACP/MCP interoperability becomes the center of the harness,
- recipes feel like the right abstraction for repeated multi-step jobs.
