# Documentation

The documentation is organized by what a reader is trying to do rather than by how the document was produced.

## Start Here

| If you want to… | Read… |
| --- | --- |
| Install the portable harness | [`getting-started/bootstrap.md`](getting-started/bootstrap.md) |
| Try it on a real project | [`getting-started/first-real-project.md`](getting-started/first-real-project.md) |
| Understand the complete workflow | [`guides/pi-harness-workflow-manual.md`](guides/pi-harness-workflow-manual.md) |
| Work on the remote homelab | [`guides/cmux-ssh-remote.md`](guides/cmux-ssh-remote.md) |
| Rebuild or repair part of the setup | [`operations/README.md`](operations/README.md) |
| See the current architecture and next work | [`current-plan.md`](current-plan.md) |
| Understand a durable choice | [`decisions/README.md`](decisions/README.md) |
| Review the research behind a choice | [`reference/README.md`](reference/README.md) |
| Inspect completed experiments and rollout evidence | [`history/README.md`](history/README.md) |

## Sections

### [Getting Started](getting-started/README.md)

Short, ordered paths for installing the harness and completing a first bounded task.

### [Guides](guides/README.md)

Task-oriented instructions for using the harness: normal workflow, remote access, review, and mobile access.

### [Operations](operations/README.md)

Detailed setup, maintenance, recovery, and package-management procedures. These are environment-sensitive; check prerequisites and status before running commands.

### [Reference](reference/README.md)

Dated research, comparisons, package intake, and design investigations. Reference material explains what informed a decision; it is not automatically current policy.

### [Decisions](decisions/README.md)

Numbered ADR-style records preserving durable choices, tradeoffs, and supersession history.

### [History](history/README.md)

Executed rollout plans and trial logs retained as evidence. Historical records should not be followed as current instructions unless an active guide links to them.

## How Current State Is Recorded

- [`../CONTEXT.md`](../CONTEXT.md) gives the compact mental model and open questions.
- [`current-plan.md`](current-plan.md) is the active review gate for substantial harness changes.
- [`decisions/`](decisions/) records why durable choices were made.
- [`../scratchpad.md`](../scratchpad.md) holds ideas that have not converged yet.

## Hints For Coding Agents

The same pages are canonical for humans and agents. Agents should:

1. read [`../AGENTS.md`](../AGENTS.md) for repository-specific safety and adaptation rules;
2. use this index to select the smallest relevant reading path;
3. consult [`current-plan.md`](current-plan.md) and related ADRs before changing a high-authority surface;
4. treat `reference/` and `history/` as evidence, not current instructions;
5. update the nearest guide or operation when implementation behavior changes.
