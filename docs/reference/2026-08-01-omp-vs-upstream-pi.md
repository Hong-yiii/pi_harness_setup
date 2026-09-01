# OMP Versus Upstream Pi As Harness Base

Date: 2026-08-01

## Question

Should this harness start from Oh My Pi (`omp`) as the base, or stay on upstream Pi with our own agents, extensions, packages, and docs layered on top?

## Snapshot

- Upstream Pi npm package: `@earendil-works/pi-coding-agent`
- Current npm latest observed: `0.83.0`
- Local installed version observed: `0.82.0`
- OMP npm package: `@oh-my-pi/pi-coding-agent`
- Current npm latest observed: `17.2.2`
- OMP npm metadata observed modified around 2026-07-31.
- OMP is not installed locally yet.

## What OMP Is

Oh My Pi is not just a preset bundle. It is a fork of Pi with coding-first behavior pushed deeper into the core.

Observed OMP built-ins and repo packages include:

- hash-anchored edits,
- LSP and DAP/debugging features,
- built-in subagents and swarm orchestration,
- plan mode,
- advisor/reviewer model roles,
- Hindsight memory,
- persistent Python/JavaScript eval cells,
- browser automation and web search,
- browser/collab live-session packages,
- local observability dashboard,
- native grep/shell/image/text/syntax modules,
- task isolation primitives,
- MCP discovery/import,
- SDK/RPC/ACP surfaces,
- broad model/provider catalog.

Official OMP language says it is a fork of Pi "extended with a batteries-included coding workflow" and first-run discovery can inherit rules, skills, and MCP servers from several other agent ecosystems.

The project is highly active. The sidecar research observed GitHub/npm release activity around `17.2.2` on 2026-07-31, with recent fixes across catalog, coding-agent, hashline, native tools, browser, LSP, MCP, Cursor bridge behavior, and performance.

## What Upstream Pi Is

Upstream Pi intentionally keeps the core small and exposes extension points:

- extensions for tools, event interception, commands, UI, provider registration, state, compaction, and policy gates,
- skills for specialized procedures,
- prompt templates for repeated rituals,
- packages for distributing extensions/skills/prompts/themes,
- JSON/RPC/SDK modes for embedding and automation.

This means our repo owns the harness policy and assembles only the pieces we choose.

## For OMP As Base

1. **Time to capability is much faster.**
   OMP gives subagents, plan mode, richer editing, memory, debugging, and provider breadth without us stitching it all together.

2. **The edit stack looks materially better.**
   Hashline edits and structural/code-aware tooling are a real reason to use OMP, not just decoration.

3. **It matches the “IDE wired into terminal” direction.**
   You want terminal/TUI workflows, observability, homelab use, and maybe phone control. OMP already thinks in terms of a richer terminal coding surface.

4. **It may reduce yak-shaving.**
   Building every missing Pi behavior ourselves burns attention. OMP can be a productive default while we learn what we actually care about.

5. **Good candidate for experiential learning.**
   Running OMP for a week would teach us which features are essential, which are noise, and which should be ported back into upstream Pi extensions.

6. **Memory is a first-class system.**
   Hindsight integration appears deeper than "dump summaries into a file": retain/recall/reflect tools, per-project scoping, mental-model summaries, auto-recall, and auto-retain.

## Against OMP As Base

1. **It is a fork, not a simple config layer.**
   If OMP diverges from upstream Pi, our harness becomes coupled to OMP's internal choices and release cadence.

2. **More built-ins means larger trust surface.**
   Memory, browser/collab, MCP import, native modules, debugging, and task isolation are powerful. They deserve deliberate review before becoming the base of local and homelab workflows.

3. **Harder to make the repo the full source of truth.**
   If OMP auto-discovers and inherits from many ecosystems, our reproducibility story can get fuzzier unless we explicitly lock that behavior down.

4. **More moving parts for homelab and phone.**
   Native modules, Rust/N-API, embedded shell behavior, memory services, and collab surfaces may be more fragile on a remote box than upstream Pi plus selected extensions.

5. **Potential model/tool confusion after upgrades.**
   Community reports suggest major tool changes can affect agent habits or memory assumptions. That is manageable, but it argues for pinning and testing upgrades.

6. **Token and context overhead may be real.**
   User reports and blog notes describe OMP as more polished but heavier than vanilla Pi because of its larger prompt and tool surface. That matters for cheap/local models and for phone/homelab sessions where responsiveness matters.

7. **Auto-discovery cuts both ways.**
   Inheriting `.claude`, `.cursor`, `.windsurf`, `.gemini`, `.codex`, `.cline`, Copilot, and VS Code state is convenient, but it can weaken reproducibility unless the harness repo explicitly records what is allowed.

## For Upstream Pi + Own Agents/Extensions

1. **Maximal ownership.**
   The harness repo stays clean: settings, agents, prompts, chosen packages, and runbooks are explicit.

2. **Better security posture.**
   We can add permissions, MCP, memory, browser, and observability one at a time with a threat model for each.

3. **Better local/homelab symmetry.**
   A minimal base is easier to reproduce on both macOS and a homelab host.

4. **Good fit for research-first behavior.**
   You said research matters more than execution. A minimal harness helps us understand and document each layer instead of inheriting opinions invisibly.

5. **Portable personal skills already fit.**
   Existing `~/.agents/skills` work naturally with upstream Pi.

## Against Upstream Pi + Own Agents/Extensions

1. **You have to assemble a lot.**
   Plan mode, stronger subagents, MCP, observability, memory, browser, permissions, and terminal orchestration all require package selection or custom work.

2. **Quality varies across packages.**
   The package catalog is large and uneven. Audit cost is real.

3. **You can accidentally rebuild OMP slowly.**
   If the desired endpoint is LSP + DAP + memory + subagents + better edits + browser + observability, starting from upstream Pi may become a long reimplementation path.

4. **Earlier productivity may be lower.**
   You may spend more time shaping the harness before it feels powerful.

## Decision Flow

Use OMP as the base if:

- you want the strongest out-of-box coding surface,
- better edits and LSP/DAP matter immediately,
- you are comfortable pinning a fork and learning its internals,
- you want to discover your preferences by using a rich system first.

Use upstream Pi as the base if:

- reproducibility and explicit choices are more important than speed,
- local/homelab security boundaries are central,
- observability and phone control should be designed from scratch,
- you want this repo to remain the source of truth rather than a companion to a fork.

## My Current Lean

Use **upstream Pi as the documented base**, and run **OMP as a parallel trial**, not the foundation yet.

Why:

- Your stated priority is research and understanding, not execution speed.
- The repo goal is "recreate the setup just from this repo."
- You need local plus homelab plus observability plus phone interaction, which are operational concerns where smaller explicit layers win.
- OMP is interesting enough that ignoring it would be silly, but adopting it before we understand the boundaries would make the harness harder to reason about.

## Proposed Experiment

Run a two-track evaluation:

1. **Baseline track:** upstream Pi + this repo's agents/prompts + selected packages only after audit.
2. **OMP track:** install OMP separately, pin version, use a separate agent dir (`~/.omp/agent`), and run the same tasks.

Compare on:

- edit reliability,
- subagent ergonomics,
- plan/review flow,
- observability hooks,
- remote/homelab install complexity,
- phone/tmux compatibility,
- reproducibility from repo,
- upgrade risk,
- subjective feel.

Do not merge OMP behavior into the main harness until it wins on observed use, not homepage gravity.

## OMP Trial Guardrails

If we trial OMP:

1. Install with a pinned method rather than a floating shell installer.
2. Keep `~/.omp/agent` separate from `~/.pi/agent`.
3. Disable or document broad auto-discovery before using it on private repos.
4. Start with a read-only/research workflow before granting full write/debug/browser/MCP surfaces.
5. Record exact config and rollback steps under an `omp/` directory in this repo.

## Adjacent Note: Goose

One sidecar found Goose as an adjacent harness candidate with agents, skills, recipes, MCP-backed extensions, OTEL, and remote serving. It is useful as a pattern reference, but it is not directly answering the Pi-vs-OMP base question.

Use Goose research only for transferable ideas:

- recipes as repeatable parameterized workflows,
- MCP tools disabled by default and enabled per task/recipe,
- built-in OTEL/logging as an observability baseline,
- remote serve/mobile as a first-class control surface.
