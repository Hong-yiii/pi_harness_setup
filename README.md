# Pi Harness Setup

Personal, reproducible setup notes for using the Pi coding agent locally, on a remote homelab, and from a phone.

This repo is the source of truth for:

- Pi configuration and portable workflow assets.
- Research on how people customize Pi.
- High-level decisions about local, homelab, observability, terminal, and mobile access.
- Runbooks to recreate the harness from a fresh machine.

## Current Shape

- `pi/agent/`: versioned Pi user-level settings, agents, prompts, and global guidance.
- `docs/research/`: source notes and synthesis from docs, blogs, packages, and community examples.
- `docs/decisions/`: durable choices and tradeoffs.
- `docs/reviews/`: living plan review and build-batch gate.
- `docs/runbooks/`: rebuild and operations instructions.
- `scratchpad.md`: live comparison notes while the setup is still taking shape.

## First Principles

1. Keep Pi itself minimal; version the harness around it.
2. Prefer portable assets first: `AGENTS.md`, prompt templates, skills, agents, and settings.
3. Add extensions only when behavior must be enforced or observed.
4. Treat local and homelab as two runtimes for the same harness.
5. Phone access should attach to durable sessions, not run fragile local mobile workflows.
6. Observability is part of the harness, not an afterthought.
7. Accumulate ideas in the current plan review, then build in reviewed batches.

## Quick Start Draft

This is intentionally incomplete while we research.

```bash
cd ~/Projects/pi_harness_setup

# Install Pi if needed.
npm install -g --ignore-scripts @earendil-works/pi-coding-agent

# Later: apply versioned config into ~/.pi/agent.
# We will add a script after the layout stabilizes.
```
