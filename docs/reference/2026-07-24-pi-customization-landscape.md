# Pi Customization Landscape

Date: 2026-07-24

## Synthesis

Pi customization seems to cluster around five layers:

1. **Core harness:** Pi stays small and terminal-first. Official positioning is "adapt Pi to your workflows" and customize with extensions, skills, prompt templates, themes, and packages.
2. **Portable prompt/context layer:** `AGENTS.md`, skills, prompt templates, and custom agent definitions capture habits without writing code.
3. **Extension enforcement layer:** permissions, plan mode, subagents, observability, custom tools, and UI changes belong in extensions because prompts cannot enforce behavior reliably.
4. **Session substrate:** tmux/zellij plus SSH/mosh/Tailscale keeps agent sessions durable across local, homelab, and phone access.
5. **Observability/control plane:** OTEL/Sentry/LangSmith/heartbeat files/session logs make running agents inspectable and recoverable.

## Official Baseline

- [Pi homepage](https://pi.dev/) frames Pi as a minimal agent harness designed to be adapted rather than accepted as a sealed product.
- [Package catalog](https://pi.dev/packages) shows the ecosystem gravity: MCP adapters, web access, subagents, context/memory packages, telemetry, and workflow packages.
- [RPC mode docs](https://pi.dev/docs/latest/rpc) matter for future phone/web control surfaces because they expose Pi as a headless JSON protocol over stdin/stdout.

## Workflow Customization Patterns

### Skills And Prompt Templates

Skills are used for progressive disclosure: load specialized workflow instructions only when relevant. Sean Pedersen's Pi notes call out `~/.agents/skills` and a contextual-skills extension that selects per-project skills to save prompt context: [Pi - Open-Source Coding Agent](https://seanpedersen.github.io/posts/pi-agent/).

Implication for us:

- Keep existing `~/.agents/skills` as the portable skill layer.
- Add project-specific skills only when a repo needs them.
- Consider contextual skill selection later if global skill count becomes noisy.

### Subagents

The Pi package catalog lists [pi-subagents](https://pi.dev/packages/pi-subagents), which provides focused child agents for review, scouting, implementation, parallel audits, saved workflows, and background jobs.

Implication for us:

- Bundled example subagents are fine for learning.
- A packaged subagent layer may be better once we want maintained features, background jobs, or richer TUI clarification.

### MCP And Web Access

The package catalog lists [pi-mcp-adapter](https://pi.dev/packages) and `pi-web-access` near the top. These are common ways to recover capabilities that other agents ship as built-ins.

Implication for us:

- Treat MCP as optional integration infrastructure.
- Do not install broad web/MCP packages until we decide trust boundaries and provider keys.

### Meta-Packages

Packages like `hotmilk` bundle several workflow extensions together. That suggests a "personal Pi distribution" pattern.

Implication for us:

- This repo should become our personal meta-package/spec.
- Avoid installing large meta-packages first; read them for ideas.

## Observability Patterns

### OpenTelemetry

Two independent sources point to OTEL as the natural shape:

- [Maksym Prokopov's Pi OTEL extension](https://prokopov.me/posts/pi-otel-telemetry-extension/) exports lifecycle traces and metrics to Grafana-compatible stacks.
- [pi-otel writeup](https://nikiforovall.blog/ai/productivity/2026/05/16/pi-otel.html) describes `pi-otel` as emitting one trace tree per user prompt, with LLM requests and tool calls as child spans.

Implication for us:

- Start observability with local Jaeger or Grafana-compatible OTLP.
- Use stable labels: host, project, model, runtime, environment.
- Later point local and homelab agents at the same collector.

### Heartbeats And Dashboards

[`@jademind/pi-telemetry`](https://github.com/jademind/pi-telemetry) publishes JSON heartbeat files per running Pi process and aggregates them into machine-level snapshots.

Implication for us:

- Heartbeats complement traces. Traces answer "what happened in a turn"; heartbeats answer "what agents are alive and waiting?"
- This is useful for phone/statusbar dashboards.

### Hosted Observability

- [Sentry's Pi monitor](https://sentry.io/cookbook/monitor-pi-with-sentry/) tracks tool calls, LLM calls, token usage, costs, and subagents as nested spans.
- [LangSmith Pi tracing](https://docs.langchain.com/langsmith/trace-with-pi) sends user messages, assistant responses, tool calls, and LLM invocations to LangSmith.

Implication for us:

- Hosted tools are attractive for convenience, but we should first decide privacy and retention policy.
- For homelab, self-hosted OTEL is probably the clean default.

## Mobile And Remote Patterns

The repeated pattern is: private networking + durable terminal multiplexer + mobile terminal + notifications.

- [Put Your Coding Agents in Your Pocket](https://simonbs.dev/posts/put-your-coding-agents-in-your-pocket/) uses Tailscale, tmux, an iPhone SSH client, and push notifications so the phone reconnects to existing agent sessions.
- [Coding from my phone](https://www.nijho.lt/post/agentic-mobile-workflow/) uses Blink Shell + Mosh for durable sessions; Mosh smooths over bad mobile networks and phone sleep.
- [Blink Shell's Tailscale + Mosh docs](https://docs.blink.sh/integrations/tailscale%2Bmosh) document SSH first, then upgrading to Mosh over Tailscale.

Implication for us:

- Use Tailscale or WireGuard for reachability.
- Use tmux first because it is universal and scriptable.
- Use Mosh for phone connections where supported.
- Add notification hooks after the Pi lifecycle/telemetry layer is chosen.

## Early Recommendation

Phase 1:

- Version Pi settings, global `AGENTS.md`, agents, and prompt templates in this repo.
- Use tmux on local and homelab.
- Document Tailscale + SSH + tmux as minimum remote access.
- Use local Jaeger or Grafana-compatible OTLP for observability experiments.

Phase 2:

- Evaluate `pi-otel`, `@jademind/pi-telemetry`, `pi-subagents`, and `pi-mcp-adapter`.
- Add an `apply` script to sync repo config to `~/.pi/agent`.
- Add host-specific profiles.

Phase 3:

- Phone workflow: Blink/Prompt/Termius/Moshi comparison.
- Notifications: brrr, ntfy, Pushover, or package-specific hooks.
- Optional web/RPC control surface for phone-friendly interaction.
