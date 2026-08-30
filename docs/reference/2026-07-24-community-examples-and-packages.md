# Community Examples And Packages

Date: 2026-07-24

## What People Seem To Be Doing

The strongest pattern is "make a personal distribution." People collect Pi extensions, skills, prompts, agents, MCP adapters, terminal helpers, and cross-agent config into a harness repo rather than just editing `~/.pi/agent` by hand.

Examples and package families:

- [Pi extension docs](https://pi.dev/docs/latest/extensions): event hooks, custom tools, commands, UI, provider registration, compaction, and policy gates.
- [Pi skills docs](https://pi.dev/docs/latest/skills): `SKILL.md` workflows with scripts/references/assets.
- [Pi prompt templates](https://pi.dev/docs/latest/prompt-templates): slash-command rituals for repeated prompts.
- [Pi package catalog](https://pi.dev/packages): installable bundles of extensions, skills, prompts, and themes.

## Package Patterns Worth Studying

### Subagents

- [pi-subagents](https://pi.dev/packages/pi-subagents) supports focused child agents for scouting, review, implementation, parallel audits, saved workflows, and background jobs.
- There are alternative subagent/swarm packages, which suggests subagent semantics are still an active design area.

Takeaway:

- Keep our first subagent setup simple.
- Adopt a package only after we know what workflow contracts we want.

### MCP

- [pi-mcp-adapter](https://pi.dev/packages) bridges MCP servers into Pi.
- Some variants emphasize proxy/direct modes and reduced context load.

Takeaway:

- MCP should be explicit and scoped. It expands capability and attack surface.
- Prefer on-demand/proxy discovery so the model does not ingest every schema every turn.

### Plan Mode

Multiple community packages implement plan mode differently. The important thing is not the UI; it is enforced read-only exploration plus an approval boundary before mutation.

Takeaway:

- Prompt-only "please plan first" is not enough for risky work.
- Use extensions when we need real tool gating.

### Meta-Packages

Packages like `hotmilk`, `pi-code`, and `pikit` bundle many workflow opinions at once.

Takeaway:

- They are useful reading material.
- We should not install a large meta-package until we can audit which behavior we actually want.

### Terminal Orchestration

Packages like `pi-teams`, tmux/zellij harnesses, verifier agents, and terminal dashboards treat the terminal multiplexer as the actual agent control plane.

Takeaway:

- Our harness should document tmux names, panes, logs, and notification hooks.
- A phone workflow becomes much easier if every agent has a stable tmux home.

## Personal Harness Repos

Useful examples mentioned in research:

- `narumiruna/pi-extensions`
- `eddmann/agent-toolkit`
- `NelsonBrandao/pi-agent-extensions`
- `dnouri/ai-config`
- `s1lver091/pi-agent-config`

We should copy patterns, not raw configs.

## Strong Heuristic

Use the lightest artifact that can carry the behavior:

- **Prompt template:** repeated one-shot ritual.
- **Skill:** deeper procedure or domain method.
- **Agent definition:** delegated role with a result contract.
- **Extension:** enforced behavior, custom tool, UI, or observability.
- **Package:** distribution/onboarding layer once a bundle stabilizes.
