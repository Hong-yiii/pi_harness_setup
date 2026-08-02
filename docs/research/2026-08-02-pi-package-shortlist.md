# Pi Package Shortlist

Date: 2026-08-02

## Working Thesis

Use upstream Pi as the base harness. Bring in packages by profile, not as one giant always-on install. The base should stay boring: package policy, safety posture, observability, tmux/Tailscale, and reproducible config before autonomy.

The current shape should be:

1. **Base:** safety, observability, profile manifests, and terminal/session substrate.
2. **Research:** web, docs, repo fetching, code exploration.
3. **Parallel:** subagents, worktrees, orchestrated workflows.
4. **Remote:** phone/web access to sessions running on the laptop or homelab.
5. **Experimental:** context/memory/style packages that can strongly shape agent behavior.

This keeps the setup reproducible while still letting the user try the power-user packages that make Pi interesting.

## Recommendation Chart

| Need | Bring In | Profile | For | Against / Risk | Recommendation |
|---|---|---:|---|---|---|
| Web search and source research | [`pi-web-access`](https://pi.dev/packages/pi-web-access) | research | Web search, URL fetch, GitHub repo clone, PDF extraction, YouTube/video understanding, source checking, provider fallbacks. | Network-heavy. API keys and optional browser-cookie access need careful config. Overlaps context/fetch packages. | Strong yes for research sessions. Keep browser cookies off by default. Do not promote to always-on base until config is boring. |
| Advanced code exploration | [`pi-lens`](https://pi.dev/packages/pi-lens) | research | LSP diagnostics/navigation, AST search/replace, symbol search, module reports, dependency map, read guards. | Large package with broad hooks and auto-detected external tools. May overlap with other read/edit/search packages. | Strong yes, but trial alone before stacking with hashline/read replacement tools. |
| Safer structural read/edit | [`pi-hashline-readmap`](https://pi.dev/packages/pi-hashline-readmap) or [`pi-readseek`](https://pi.dev/packages/pi-readseek) | research / experimental | Hash-anchored reads/edits, structural search, better maps, less stale-edit risk. | Replaces or remaps core file tools. High conflict chance with `pi-lens` and other edit packages. | Valuable, but not first install. Pick one read/edit replacement after `pi-lens` is tested. |
| Subagents, day-to-day | [`pi-subagents`](https://pi.dev/packages/pi-subagents) | parallel | Focused child agents, scout/researcher/planner/worker/reviewer roles, parallel reviewers, review loops, background jobs. | Adds a major delegation surface. Needs prompt discipline around when to delegate, caps, and tool inheritance decisions. | Strong yes. Test after one manual worktree flow exists. |
| Orchestrator-owned loops | [`@quintinshaw/pi-dynamic-workflows`](https://pi.dev/packages/%40quintinshaw/pi-dynamic-workflows) | parallel / experimental | Claude-Code-style workflows, JS orchestration, parallel subagents, model routing, cost accounting, resume, worktree isolation, `/deep-research`. | Powerful. Node workflow execution and background orchestration need trust review. Auto triggers and high fanout can surprise. May make evals less transparent if generated workflows are not saved. | Yes for the orchestrator lane, after basic subagents/worktrees. Disable keyword trigger, cap agents/concurrency/tokens, and save reviewed workflows in this repo. |
| User-authored deterministic loops | Pi SDK/RPC/JSON mode ([SDK](https://pi.dev/docs/latest/sdk), [RPC](https://pi.dev/docs/latest/rpc), [JSON](https://pi.dev/docs/latest/json)) | harness source | Best for evals, routing, repeatability, trace capture, fixed budgets, and custom scoring. | More engineering work than package orchestration. | Build this ourselves. This repo should own the evaluation truth. |
| Worktree safety | [`@season179/pi-worktree`](https://pi.dev/packages/%40season179/pi-worktree) | parallel | Narrow `--worktree` guardrail, temporary branch/worktree, path redirection, escape blocking, dirty-worktree warning. | Guardrail only, not an OS sandbox. No dashboard or setup hooks. | Best first manual worktree layer for risky local exploration. |
| Reproducible worktree setup | [`pi-worktree`](https://pi.dev/packages/pi-worktree) | parallel | Project `.pi/worktree.json`, branch naming, env links, dependency hooks, tmux/cmux relaunch. | Runs configured shell hooks. Lower package activity/downloads. | Good for per-project setup once we know the hook conventions we want. |
| Model-callable worktree tool | [`@pandi-coding-agent/worktree`](https://pi.dev/packages/%40pandi-coding-agent/worktree) | parallel / experimental | `/worktree` TUI and `git_worktree` tool with list/add/open/remove/prune. | Model-callable prune/remove need explicit guardrails; less mature. | Useful later if the agent should manage worktrees directly. |
| Plan mode UX | [`@plannotator/pi-extension`](https://pi.dev/packages/%40plannotator/pi-extension) | research / parallel | Browser plan review, annotations, approve/deny/refine loop, restricted planning phase. | Large UI package. Relies on extension enforcement. Remote browser flow needs testing. | Trial. Keep existing lightweight plan mode until this proves reliable. |
| Lightweight plan mode | [`pi-plan`](https://pi.dev/packages/pi-plan) | base / research candidate | Simpler read-only planning and checklist execution flow. | Less visual and less rich than Plannotator. | Fallback if Plannotator feels heavy. |
| Observability in terminal | [`pi-observability`](https://pi.dev/packages/pi-observability) or [`pi-sidebar-tui`](https://pi.dev/packages/pi-sidebar-tui) | base / remote | Tokens, cost, TPS, runtime, git status, context, todos, subagents, MCP status. | UI/status packages can conflict visually; observability bars duplicate each other. | Pick one human status surface first. Prefer `pi-observability` for metrics; test `pi-sidebar-tui` only if active parallel work needs a side rail. |
| Production traces | OTLP/Langfuse packages such as [`@devkade/pi-opentelemetry`](https://pi.dev/packages/%40devkade/pi-opentelemetry) or [`pi-langfuse`](https://pi.dev/packages/pi-langfuse) | remote / experimental | Durable traces for sessions, turns, tools, tokens, cost, and errors. | Privacy and data export need policy. Prompt/tool capture should be opt-in. | Later. Start local observability first, then choose an exporter for homelab. |
| Better browser UI | [`@firstpick/pi-package-webui`](https://pi.dev/packages/%40firstpick/pi-package-webui) or [`pi-studio`](https://pi.dev/packages/pi-studio) | remote / experimental | Browser UI, multi-tab sessions, model controls, workspace navigation, continuity features. | Broader server/control surface. Remote exposure needs auth and Tailnet-only binding. | Trial on homelab, not base. Prefer localhost/Tailscale-only operation. |
| Phone interaction | [`@malinamnam/pi-phone`](https://pi.dev/packages/%40malinamnam/pi-phone), Telegram bridges, or Usher | remote / experimental | Phone-first UI, session mirroring, remote prompts, parallel child RPC sessions, Tailscale-friendly patterns. | Mobile control means remote command authority. Auth, idle timeout, and network binding matter. Usher is not a Pi package. | Use Tailscale + SSH/tmux as baseline. Trial one phone surface after remote threat model. |
| Context saving / memory | [`context-mode`](https://pi.dev/packages/context-mode) | experimental | Sandbox execution, FTS5 knowledge base, session continuity, intent search, context-saving claims. | High influence surface: MCP server, hooks, SQLite, tool routing, Elastic-2.0 license, possible overlap with Pi compaction. | Debate, then trial. Do not put in base until we measure before/after on real research tasks. |
| Minimalism / anti-overbuild | [`@dietrichgebert/ponytail`](https://pi.dev/packages/%40dietrichgebert/ponytail) | experimental / personal | Encourages reuse, stdlib/native features, smaller diffs, no overbuilding. Low dependency count. | Behavior-injection layer. Can fight early exploration if always-on and too strong. | Good taste layer. Use selectively or in lite mode for implementation/review, not initial research. |

## Loop Architecture

### 1. User-authored deterministic loops

Use Pi SDK, RPC, or JSON mode to build loops in this repo. This should own:

- task graph,
- model routing,
- worktree creation,
- retry limits,
- eval scoring,
- artifact capture,
- cost and token budgets,
- final synthesis.

This lane is for repeatable evals and harness experiments. It should write run bundles that include prompt, package profile, source SHA, worktree branch, session path, JSON/RPC log, diff, tests, score, and notes.

### 2. Orchestrator-managed loops

Use packages such as `pi-subagents` and `@quintinshaw/pi-dynamic-workflows` when the goal is interactive throughput: deep research, many-agent review, broad audits, or parallel implementation. The orchestrator can own phase planning and fanout, but the resulting workflow scripts and summaries should be saved back into this repo when they become reusable.

## Surface Ownership Rule

Pick exactly one owner per high-authority surface at a time:

| Surface | First Owner | Trial Later | Avoid |
|---|---|---|---|
| Web/search/fetch | `pi-web-access` | `context-mode` fetch/index tools | Multiple web/MCP fetch stacks at once |
| Code exploration | `pi-lens` | semantic index package | Installing LSP/index/hashline bundles together first |
| Read/edit replacement | stock Pi initially | `pi-hashline-readmap` or `pi-readseek` | More than one read/edit override |
| Plan mode | bundled/simple plan mode initially | Plannotator | Two plan owners with different approval state |
| Manual worktrees | `@season179/pi-worktree` | `pi-worktree` or `@pandi-coding-agent/worktree` | Multiple worktree managers |
| Orchestrated worktrees | none initially | `@quintinshaw/pi-dynamic-workflows` | Letting two orchestrators own branch cleanup |
| Human status | `pi-observability` | `pi-sidebar-tui` | Multiple footers/sidebars/cost widgets |
| Remote/mobile | SSH/tmux/Tailscale | one web/phone/Telegram/Usher surface | Public web exposure or multiple remote controllers |

## OMP vs Upstream Pi

Keep upstream Pi as the base. Use OMP as a comparison lane only.

Reasons:

- Most packages above are Pi-native and published through the Pi package catalog.
- OMP can be a powerful bundled environment, but it changes too much of the baseline at once.
- Package conflicts are easier to diagnose on upstream Pi.
- The repo should make the setup reproducible from first principles, not depend on a broad fork until a specific OMP feature proves worth adopting.

## Adoption Order

1. Document profile manifests, package audit checklist, rollback commands, and safety rules.
2. Set up tmux/Tailscale baseline and one local observability/status layer.
3. Trial `pi-web-access` with browser-cookie paths disabled.
4. Trial `pi-lens` by itself on one real repo.
5. Add one manual worktree package, then `pi-subagents`.
6. Build the first deterministic RPC/SDK eval loop in this repo.
7. Trial one plan-mode owner.
8. Trial `@quintinshaw/pi-dynamic-workflows` with trigger off and hard caps.
9. Trial one remote/mobile surface on Tailscale.
10. Debate `context-mode` with measured before/after data.
11. Add Ponytail as an implementation/review taste layer if it matches the user's habits.

## Sources

- Pi extension docs: https://pi.dev/docs/latest/extensions
- Pi SDK docs: https://pi.dev/docs/latest/sdk
- Pi RPC docs: https://pi.dev/docs/latest/rpc
- Pi JSON mode docs: https://pi.dev/docs/latest/json
- Pi package catalog entries linked in the chart above.
