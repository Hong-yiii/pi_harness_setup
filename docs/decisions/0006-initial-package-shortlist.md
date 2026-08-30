# 0006: Initial Pi Package Shortlist

Date: 2026-08-02

## Status

Superseded by ADR 0009

## Decision

Use upstream Pi as the base and adopt packages in lanes. Shrink the install surface until each high-authority area has exactly one owner.

- **Base soon:** profile manifests, package audit checklist, safety policy, tmux/Tailscale notes, one observability/status layer.
- **Research trial:** `pi-web-access`, then `pi-lens`.
- **Parallel trial:** one narrow worktree package, then `pi-subagents`.
- **Harness source:** custom deterministic loops using Pi SDK/RPC/JSON mode.
- **Orchestrator trial:** `@quintinshaw/pi-dynamic-workflows`.
- **Remote trial:** Tailscale plus one web/phone surface. `@malinamnam/pi-phone` is the Pi-native candidate; Usher is the adjacent cross-agent hub candidate.
- **Implementation/review trial:** Ponytail, opt-in or lite mode.
- **Experimental:** `context-mode`, hashline/read replacement packages, OTLP/Langfuse exporters.

## Rationale

The user wants parallel research, observability, remote access, worktrees, and eventually loop engineering. Those goals are real, but several candidate packages intercept the same high-authority surfaces:

- `read` / `edit` / `grep`,
- tool calls,
- session lifecycle,
- compaction/context,
- remote UI,
- subagent spawning,
- git worktree creation/removal.

Installing all of them would make behavior harder to explain and reproduce. The harness should start with small profiles and promote packages only after source review and smoke tests.

## For / Against

| Candidate | For | Against | Decision |
| --- | --- | --- | --- |
| `pi-web-access` | Directly satisfies research and web search. Broad source support. | API keys, network, optional cookies; overlaps context/fetch packages. | Research profile first. |
| `pi-lens` | Best code-exploration fit. | Large and broad; may overlap with read/edit replacements. | Trial first, alone. |
| `pi-subagents` | Natural subagent layer for scouting/review. Strongest Pi-native maturity signal in this comparison. | Adds delegation behavior; needs caps, model scope, and inheritance rules. | Trial after manual worktree flow exists. |
| Worktree package | Worktrees are mandatory for user workflow. | Git/remove hooks need care. | Pick exactly one narrow package first. |
| `@quintinshaw/pi-dynamic-workflows` | Best orchestrator candidate, includes worktree isolation and cost accounting. Complementary to `pi-subagents`. | Overlaps subagents in fanout, status, budgets, model routing, and worktrees; workflow generation must be reviewed; auto trigger and fanout need caps. | Trial after basic subagents/worktrees with trigger off. |
| `context-mode` | Strong upside for long research and context saving. | MCP/hooks/SQLite/tool routing/license concerns. | Experimental only until measured. |
| Ponytail | Good taste layer for smaller diffs. Zero deps and strong popularity signal. | Can constrain exploration; young despite popularity. | Selected opt-in implementation/review mode. |
| `pi-phone` | Pi-native phone UI; mirrors live Pi session and can spawn parallel RPC sessions. | Low adoption, unknown license, remote command authority. | Tailnet-only Pi-phone trial after threat model. |
| Usher | Cross-agent browser/PWA hub for Pi, Codex, and Claude Code; clearer password/security docs. | Not a Pi package, early adoption, remote command authority. | Adjacent hub trial only if cross-agent remote control becomes the goal. |

## Consequences

- The repo needs machine/profile manifests before installation.
- The first real build step should create a package audit checklist and profile files.
- The deterministic harness should not depend on third-party orchestrator packages for its evaluation truth.
- Remote/mobile packages must be tested on the homelab with local-only or Tailnet-only bindings.
- The package plan should name one owner for each surface: web, code exploration, read/edit, plan mode, worktrees, human status, remote UI, and orchestration.

## Open Questions

- Which observability sink should be canonical: local footer/dashboard first, or OTLP/Langfuse from day one?
- Which worktree behavior feels best: temporary safety worktrees, reusable per-project worktrees, or model-callable worktree tools?
- Does `context-mode` materially improve this user's research sessions, or does Pi's native compaction plus careful subagents cover enough?
- Should Ponytail default to lite, full, or explicit command-only in review/implementation profiles?
- Should the first remote/mobile package be Pi-native `pi-phone`, or should the broader Codex/Pi/Claude shape push us toward Usher?
