# 0004: Base Harness On Upstream Pi, Trial OMP Separately

Date: 2026-08-01

## Status

Accepted

## Decision

Keep upstream Pi as the documented/reproducible base for this repo.

Evaluate Oh My Pi as a separate trial runtime, not as the foundation yet.

## Rationale

The harness goal is reproducibility across local and homelab environments, with observability, phone access, and explicit security boundaries. Upstream Pi's minimal model makes it easier for this repo to own those choices.

OMP is compelling because it ships richer coding behavior out of the box, especially hashline edits, subagents, LSP/DAP, memory, and provider breadth. Those features should be tested seriously, but as an experiment with its own pinned install and isolated config.

This is not a rejection of OMP. It is a sequencing decision: learn from OMP, trial it seriously, but keep the base small until OMP wins on observed workflow and reproducibility.

## Consequences

- Main repo layout stays under `pi/agent/`.
- Add an `omp/` section only if the OMP trial begins.
- Do not auto-import broad config from other agent ecosystems until explicitly reviewed.
- Record version, install method, config dir, and rollback steps for any OMP trial.
- Treat OMP's auto-discovery and broad built-in tool surface as a security/reproducibility question, not just a convenience.

## Revisit When

- OMP wins clearly on edit reliability and daily flow.
- We understand how to make OMP config reproducible from this repo.
- OMP observability and homelab install story are acceptable.
- Upstream Pi package assembly becomes more expensive than maintaining the fork.
