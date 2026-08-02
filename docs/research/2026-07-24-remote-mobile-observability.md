# Remote, Mobile, And Observability Patterns

Date: 2026-07-24

## Recommended Baseline

Run Pi inside durable terminal sessions on both local and homelab hosts.

```text
phone/laptop
  -> Tailscale or WireGuard
  -> SSH or Mosh
  -> tmux
  -> pi
```

This makes the phone a control surface, not the fragile place where the agent actually runs.

## Remote Access

### Private Network

Use Tailscale first unless there is a strong reason to self-manage WireGuard.

Reasons:

- Fast setup across local, homelab, and phone.
- No public SSH exposure or router port forwarding.
- ACLs and device identity can be layered in later.

WireGuard remains a good option if the homelab should avoid a SaaS control plane.

### SSH

Use SSH for automation, Git, file transfer, and reliable terminal access.

Baseline:

- Disable password login.
- Use keys or Tailscale SSH identity.
- Do not expose port 22 publicly if avoidable.
- Prefer a dedicated Unix user for the harness on the homelab.

### Mosh

Use Mosh for phone and flaky-network interactive sessions. It handles roaming and sleep better than SSH.

Limits:

- Not for port forwarding.
- Not for file transfer.
- Needs UDP paths open inside the private network.

## Terminal Multiplexer

Use tmux first.

Reasons:

- Stable, universal, scriptable, easy to teach.
- Sessions survive disconnects.
- Pane/window names can become observability identifiers.
- Logging and notification hooks can hang off tmux.

Potential session pattern:

```bash
tmux new -s pi-main
tmux new -s pi-research
tmux new -s pi-longrun
```

## Phone Clients

Evaluate:

- Blink Shell: strong iOS Mosh support and keyboard customization.
- Prompt: polished iOS SSH experience.
- Termius: cross-platform and common.
- Moshi: agent-oriented iOS terminal with notification/workflow features.

Initial preference:

- Start with Blink Shell if iOS and Mosh matter most.
- Keep Termius as cross-platform fallback.

## Observability

### Trace Layer

OTEL is the clean default shape.

Sources:

- [Pi OTEL extension writeup](https://prokopov.me/posts/pi-otel-telemetry-extension/) describes traces and metrics for sessions, prompts, turns, tool calls, LLM requests, token counts, and tool durations.
- [pi-otel writeup](https://nikiforovall.blog/ai/productivity/2026/05/16/pi-otel.html) describes one trace tree per user prompt with LLM and tool spans.

Candidate first experiment:

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/jaeger:2 \
  --set receivers.otlp.protocols.http.endpoint=0.0.0.0:4318

OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 pi
```

### Runtime Status Layer

[`@jademind/pi-telemetry`](https://github.com/jademind/pi-telemetry) publishes JSON heartbeat files per running Pi process.

This solves a different problem from traces:

- Is an agent currently running?
- Which host/project/session?
- Is it waiting, active, or stale?
- Can a phone/statusbar/dashboard show it?

### Hosted Options

- [Sentry Pi monitor](https://sentry.io/cookbook/monitor-pi-with-sentry/) for tool/LLM/cost traces and subagent nesting.
- [LangSmith Pi tracing](https://docs.langchain.com/langsmith/trace-with-pi) for session traces with user messages, assistant responses, tool calls, and LLM invocations.

These are useful but should wait on a privacy/retention decision.

## Notifications

Likely options:

- `ntfy`: simple HTTP push to phone.
- Apprise: one wrapper for many notification backends.
- brrr/tap-to-tmux style: notification opens the exact tmux pane.

Trigger candidates:

- Agent finished.
- Agent needs input or approval.
- Command failed.
- Long-running task exceeded expected time.
- Host low disk, high memory, high temperature, or SSH anomaly.

## Security Posture

Default:

- No public SSH.
- Private mesh VPN only.
- Dedicated harness user on homelab.
- Secrets outside git.
- Logs are useful but must not capture secrets by default.
- Web terminals only behind private network and strong auth.

Avoid initially:

- Public web shell.
- Always-on full terminal recording.
- Installing large unaudited Pi meta-packages.
