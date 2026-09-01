# Subagents, Workflows, Phone UI, Ponytail Maturity Review

Date: 2026-08-03

## Summary

This pass revisits the current package chart with four questions:

1. Do `pi-subagents` and `@quintinshaw/pi-dynamic-workflows` conflict?
2. How does `@malinamnam/pi-phone` compare with Usher?
3. Should Ponytail be used?
4. How credible, popular, mature, and supportable are these tools and dependencies?

## Recommendation Updates

- `pi-subagents` and `@quintinshaw/pi-dynamic-workflows` are **complementary but overlapping**. Use `pi-subagents` first for day-to-day delegation. Use dynamic workflows later for explicit orchestrator-managed fanout.
- `pi-phone` and Usher solve different remote/mobile jobs. `pi-phone` is Pi-native and narrow. Usher is not a Pi package, but is a broader cross-agent session hub for Pi, Codex, and Claude Code.
- Use Ponytail, but as an opt-in implementation/review taste layer, not as always-on research behavior.
- The main risk is not dependency count. Dependencies are small. The main risk is authority: spawning child agents, opening remote control surfaces, or injecting behavioral rules.

## Subagents vs Dynamic Workflows

Verdict: overlap, not direct conflict.

| Axis | `pi-subagents` | `@quintinshaw/pi-dynamic-workflows` | Harness Call |
|---|---|---|---|
| Primary job | Delegation to focused child agents. | Orchestrated workflow runtime. | Different owners. |
| User experience | Natural language: use scout, researcher, planner, worker, reviewer, oracle. | Explicit `/workflows` and generated/saved JS workflows. | Subagents first, workflows later. |
| Execution model | Child Pi sessions/processes, foreground or background, with status/fleet views. | Parent creates deterministic JS workflow using `agent()`, `parallel()`, `pipeline()`, `phase()`. | Workflows are better for scripted fanout. |
| Worktrees | Can run subagents in isolated worktrees. | Per-agent `isolation: "worktree"`. | Do not let both own worktree cleanup on the same run. |
| Observability | Fleet/status views, artifacts, JSONL lifecycle files, tokens/cost when reported. | Strong phase/run view: tokens, cost, live tok/s, cache/fresh tokens, journals. | Workflows have stronger orchestration observability. |
| Persistence | Saved chains and async artifacts. | Journaled resume, saved workflows, state under `~/.pi/workflows`. | Save reusable workflows into this repo after review. |
| Trigger risk | Mostly prompt/command driven. | Keyword trigger for `workflow`/`workflows` is on by default. | Disable trigger during trial. |
| Maturity signal | Strongest Pi-native candidate. | Promising and active, but younger. | Install order: subagents before workflows. |

Practical rule:

- Use `pi-subagents` for "get a second opinion", "scout this area", "review this diff", "run three reviewers".
- Use dynamic workflows for "fan this across many agents with model routing, budgets, verification, and resumable phases".
- Use repo-owned SDK/RPC/JSON loops for eval truth and deterministic benchmark runs.

## Pi Phone vs Usher

| Axis | `@malinamnam/pi-phone` | Usher |
|---|---|---|
| Install | Pi package: `pi install npm:@malinamnam/pi-phone`. | Standalone Go tool: install script or `go install github.com/nexustar/usher/cmd/usher@latest`. |
| Scope | Pi-only phone UI extension. | Cross-agent hub for Pi, Codex, and Claude Code. |
| Interface | Phone web UI over local WebSocket server. | Browser/PWA, Web Push, optional Telegram/Lark, per-session tmux shell, editor links. |
| Session model | Mirrors the current live Pi CLI session; can spawn parallel `pi --mode rpc` child sessions. | Discovers native session transcripts in place and drives native CLIs. |
| Security posture | Localhost by default, generated token, idle auto-stop, optional Tailscale Serve. Token can be disabled and browser stores token in local storage. | Password auth, Argon2id hash, HMAC cookie secret, login rate limits, refuses direct non-loopback bind without password. |
| Homelab fit | Best Pi-native phone trial. | Better if the desired end state is one dashboard for Pi + Codex + Claude. |
| Maturity | Small and possibly stale. | Early, but actively pushed and has clearer security docs. |

Recommendation:

- Baseline remains `SSH + tmux/cmux + Tailscale`.
- First Pi-native phone experiment: `pi-phone`, only behind Tailscale and after source review.
- First cross-agent remote hub experiment: Usher, only behind Tailscale/password and after threat model.
- Do not run multiple remote controllers at once.

## Ponytail

Decision: use Ponytail as a selected trial, but only in implementation/review mode.

Why it fits:

- The user's workflow values high judgment, smaller diffs, and avoiding unnecessary buildout.
- Ponytail has zero npm dependencies and a clear rule ladder: skip, reuse, stdlib, native platform, installed dependency, one line, then minimum custom code.
- It explicitly says not to cut validation, data-loss handling, security, or accessibility.

Why it should not be global yet:

- It is a behavior-injection layer.
- It may fight research, prototyping, or deliberate exploration.
- Huge popularity does not remove the need to test the effect on this user's actual work.

Initial mode:

- `implementation` profile: Ponytail lite/full.
- `review` profile: Ponytail review/audit/debt commands.
- `research` profile: off unless explicitly requested.

## Maturity Matrix

Signals checked on 2026-08-03 using Pi package pages, npm metadata, and GitHub repository metadata.

| Tool | Adoption / Activity | Package / Deps | Support Signals | Red Flags | Verdict |
|---|---:|---|---|---|---|
| `pi-subagents` | Pi page: 170.9K/mo, 68.3K/wk. GitHub API: 2,831 stars, 446 forks, pushed Aug 1, 2026. Npm versions: 98. | Version 0.40.0. MIT. 2.7 MB. Deps: `jiti`, `typebox`, `yaml`; Pi peers. | Active repo, issue tracker, tests, docs, artifacts, model/tool config. | Still 0.x and fast-moving. Powerful child-agent authority. | Most mature subagent candidate. Pin and trial first. |
| `@quintinshaw/pi-dynamic-workflows` | Pi page: 29K/mo, 5.9K/wk. GitHub API: 347 stars, 75 forks, pushed Jul 31, 2026. Npm versions: 49. | Version 3.5.0. MIT. 1.9 MB. Dep: `acorn`; Pi/typebox peers. | Strong docs, tests/release checks, journaled resume, visible runs. | Keyword trigger on by default. High fanout and worktree authority. State outside repo. | Promising orchestrator, but trial later with caps and trigger off. |
| `@malinamnam/pi-phone` | Pi page: 149/mo, 32/wk. GitHub API: 56 stars, 11 forks, pushed Mar 23, 2026. Npm versions: 13. | Version 0.0.13. License unknown. 318 KB. Dep: `ws`. | Clear README and Tailscale-oriented flow. | Low adoption, no license verified, older tested Pi version, token can be disabled. | Pi-native phone experiment only. Defer until remote threat model. |
| Usher | GitHub API: 19 stars, 2 forks, pushed Aug 1, 2026. Releases through v0.8.1 on Jul 24, 2026. | Go tool, MIT. Deps: `fsnotify`, `x/crypto`, `x/sys`, `x/term`. Not a Pi/npm package. | Good security docs, local-first architecture, password/tunnel guidance. | Very early adoption. Remote control surface. No Pi package catalog signal. | Interesting cross-agent hub. Trial behind Tailscale/password only. |
| `@dietrichgebert/ponytail` | Pi page: 35.3K/mo, 9,276/wk. GitHub API: 93,836 stars, 5,164 forks, pushed Jul 15, 2026. Npm versions: 4. | Version 4.8.4. MIT. 1.1 MB. 0 deps/0 peers. | Benchmarks, multi-agent adapters, large public attention. | Very young. High issue/PR volume. Can over-constrain exploration if always-on. | Use selectively. Good implementation/review taste layer. |

## Dependency Notes

| Dependency | Used By | Maturity Note |
|---|---|---|
| `acorn` | dynamic workflows | Established JavaScript parser, MIT, active maintainers. |
| `ws` | pi-phone | Established WebSocket package, MIT, active maintainers. Needs normal vulnerability watching. |
| `jiti` | pi-subagents | Active runtime TypeScript/ESM loader, MIT. |
| `typebox` | pi-subagents and dynamic workflows peer | Active schema/type utility, MIT. |
| `yaml` | pi-subagents | Established YAML parser, ISC. |
| Go `x/crypto`, `x/sys`, `x/term`, `fsnotify` | Usher | Small and conventional Go dependency set. |

## Chart Changes To Carry Forward

- Move Ponytail from `Open` to `Selected trial`.
- Keep `pi-subagents` and dynamic workflows separate:
  - `pi-subagents`: day-to-day delegation owner.
  - dynamic workflows: explicit orchestrator owner.
- Mark dynamic workflows as not conflicting with subagents in principle, but conflicting if both own worktrees/status/fanout in the same task.
- Split remote/mobile into:
  - Pi-native phone UI: `pi-phone`, immature.
  - Adjacent cross-agent hub: Usher, early but better security posture.
- Add maturity to package adoption criteria.

## Sources

- `pi-subagents`: https://pi.dev/packages/pi-subagents and https://github.com/nicobailon/pi-subagents
- `@quintinshaw/pi-dynamic-workflows`: https://pi.dev/packages/%40quintinshaw/pi-dynamic-workflows and https://github.com/QuintinShaw/pi-dynamic-workflows
- `@malinamnam/pi-phone`: https://pi.dev/packages/%40malinamnam/pi-phone and https://github.com/MaliNamNam/pi-phone
- Usher: https://github.com/nexustar/usher
- Usher security: https://github.com/nexustar/usher/blob/main/docs/reference/security.md
- Usher remote access: https://github.com/nexustar/usher/blob/main/docs/solutions/remote-access.md
- Ponytail: https://pi.dev/packages/%40dietrichgebert/ponytail and https://github.com/DietrichGebert/ponytail
