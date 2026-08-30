# Observability

Status: `pi-observability` installed as the first local status layer; trace backend remains open

## Current Baseline

The lean profile installs `pi-observability` as the single human-status owner for normal Pi sessions. Its package pin lives in `pi/package-profiles/lean-default.json` and is applied by `scripts/apply-pi-setup.mjs`.

Verify the installed baseline with:

```bash
pi list
```

Do not add another footer, sidebar, cost widget, or status owner until the current package has been evaluated in real interactive sessions. Record a proposed observability change in [`../current-plan.md`](../current-plan.md) first.

## Goals

- See what Pi is doing across local and homelab runtimes.
- Track useful status without making normal sessions noisy.
- Add traces, token/cost reporting, errors, and waiting state only through a reviewed owner.
- Keep credentials, prompts, tool inputs, and session logs out of Git.

## Open Backend Decision

The first local status owner has been selected, but the trace and long-term storage layer has not. Current candidates remain:

- local OTEL traces with Jaeger;
- Grafana LGTM or an existing homelab observability stack;
- a hosted service such as Sentry or LangSmith after a separate data review;
- a narrow heartbeat/status channel for “what is running now?” if the installed layer does not cover it.

## Optional Local Jaeger Trial

Untested as the repository default. Run only as an explicit experiment:

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/jaeger:2 \
  --set receivers.otlp.protocols.http.endpoint=0.0.0.0:4318

OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 pi
```

Open `http://localhost:16686`, verify what data leaves Pi, and remove the container after the trial if it is not adopted.

## Before Promoting A Backend

Document:

1. the data captured, including prompts and tool arguments;
2. where data is stored and how long it is retained;
3. network listeners and authentication boundaries;
4. package/version pinning;
5. rollback and data deletion;
6. one smoke test demonstrating useful signal without a second UI owner.
