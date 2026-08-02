# Observability Runbook

Status: Draft

## Goals

- See what Pi is doing across local and homelab.
- Track tool calls, LLM calls, token usage, costs, errors, and waiting state.
- Keep a low-friction local setup before choosing hosted observability.

## Candidate Stack

### Local First

- `pi-otel` or equivalent OTEL extension.
- Jaeger for initial traces.
- Later: Grafana LGTM or existing homelab observability stack.

### Runtime Status

- `@jademind/pi-telemetry` style heartbeat files.
- Machine-level dashboard or statusbar.
- Notification bridge for "needs input", "finished", "errored".

### Hosted Options

- Sentry Pi monitor.
- LangSmith Pi extension.

## Local Jaeger Experiment

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/jaeger:2 \
  --set receivers.otlp.protocols.http.endpoint=0.0.0.0:4318

OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 pi
```

Open:

```text
http://localhost:16686
```

## Decision Needed

Choose the first observability package after testing:

- `pi-otel`: trace-first, OTLP-compatible.
- `@jademind/pi-telemetry`: heartbeat/status-first.
- Sentry/LangSmith: hosted trace/product analytics.
