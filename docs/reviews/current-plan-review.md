# Current Plan Review

Date started: 2026-08-02
Status: Lean-default batch executed at user scope on 2026-08-03

## Purpose

This is the gate between research and implementation.

Use this document to accumulate the current shape of the Pi harness, unresolved ideas, and candidate build batches. When enough ideas have converged, update this review, mark a build batch as ready, and only then implement the batch.

The goal is to avoid installing or wiring one package at a time just because it looks interesting. The harness should change in reviewed, reproducible batches.

## Review Rule

Before any meaningful build/configuration pass:

1. Add the proposed change to this document.
2. Classify it as `Decided`, `Leaning`, `Trial`, `Open`, or `Rejected`.
3. Identify the affected surface: web/search, code exploration, read/edit, plan mode, worktrees, subagents, orchestration, observability, remote/mobile, UI, or safety.
4. Check that the change does not introduce a second owner for the same high-authority surface.
5. Add install, rollback, smoke test, and trust notes if the change touches Pi packages or remote access.
6. Move the change into the next build batch only after review.

## Current North Star

Build a reproducible personal Pi harness for:

- local laptop work,
- remote homelab work over private networking,
- phone interaction with durable sessions,
- observable agent runs,
- parallel workflows through worktrees and subagents,
- deterministic loops/evals owned by this repo,
- optional orchestrator-managed loops after the basics are stable.

## Current Shape

| Layer | Current State | Notes |
| --- | --- | --- |
| Base Pi | Use upstream Pi as documented base. | OMP remains a separate benchmark/trial lane, not the foundation. |
| Repo as source of truth | Active. | Config, decisions, runbooks, prompts, agents, and future scripts live here. |
| Package policy | Lean default accepted. | Keep normal sessions small; move orchestration and remote controls out of the default. |
| Safety | Underdefined. | Needs explicit package audit checklist and secret/log policy before autonomy increases. |
| Terminal/session interface | cmux Remote tmux remains the validated baseline while a Linux-owned cmux TUI runtime is trialed over Tailscale/SSH. | During the trial, cmux TUI owns only disposable `agents-pilot` workspaces. tmux continues to own existing durable sessions and rollback until daemon lifecycle, reboot recovery, version skew, and UX pass. |
| Observability | `pi-observability` installed as first local status layer. | Trial behavior in real interactive sessions before adding sidebar/status packages. |
| Web research | `pi-web-access` installed. | Browser-cookie paths stay disabled unless deliberately enabled. |
| Code exploration | `pi-lens` installed. | Trial alone before any read/edit replacement package. |
| Read/edit replacement | Stock Pi first. | `pi-hashline-readmap` or `pi-readseek` later, one at a time. |
| Structured user decisions | Stock Pi UI prompts only. | `pi-ask-user` is a trial candidate for a model-callable `ask_user` tool and bundled decision-gating skill; not installed yet. |
| Plan mode | Existing/simple plan mode remains enabled globally. | Plannotator is a trial candidate if visual annotation matters. |
| Worktrees | Native Git worktrees own persistent PR lanes; `piwt` is an optional shell helper. | `pi-subagents` may own temporary child worktrees only for explicit parallel writer runs. |
| Subagents | `pi-subagents` installed as day-to-day delegation owner. | Bundled example `subagent` symlink was disabled to avoid duplicate tool ownership. |
| Orchestration | Remove the dynamic-workflows extension from the default. | Repo-owned routing, loops, and evals live under `automation/` and run explicitly. |
| Deterministic loops/evals | Repo-owned. | Build with Pi SDK/RPC/JSON mode; this is the evaluation truth. |
| Remote/mobile | Trial Linux-owned cmux TUI with a Mac TUI thin client; keep cmux Remote tmux and direct SSH/tmux as the validated fallback. | Direct iOS-to-Linux cmux remains `Untested`. `pi-phone` and Usher remain excluded. |
| Minimalism/taste | Ponytail remains in the default at `lite`. | Its bundled command skills are hidden from the default skill catalog. |
| Background commands | Add a focused background-task owner. | Pin `pi-background-tasks@0.6.0`; later releases add unrelated always-on orchestration. |
| Skills | Seven general skills. | `diagnose`, `caveman`, `grill-with-docs`, `handoff`, `to-prd`, `to-issues`, and `zoom-out`. Pi Lens also injects four tool-specific guides that cannot be filtered without disabling or forking Pi Lens. Other package skills are disabled. |
| Context/memory | `context-mode` is interesting. | Experimental until measured on real research tasks. |

## Surface Ownership

Pick one active owner per high-authority surface:

| Surface | First Owner | Trial Later | Avoid |
| --- | --- | --- | --- |
| Web/search/fetch | `pi-web-access` | `context-mode` fetch/index tools | Multiple web/MCP fetch stacks at once |
| Code exploration | `pi-lens` | semantic index package | Installing LSP/index/hashline bundles together first |
| Read/edit replacement | stock Pi | `pi-hashline-readmap` or `pi-readseek` | More than one read/edit override |
| Plan mode | bundled/simple plan mode | Plannotator | Two plan owners with different approval state |
| Structured user decisions | stock Pi UI prompts | `pi-ask-user` | Multiple tools or skills enforcing competing decision gates |
| Persistent PR worktrees | native Git CLI, optionally through `piwt` | a package only after a new compatibility review | Starting Pi before entering the real worktree |
| Temporary child worktrees | `pi-subagents` with explicit `worktree: true` | repo-owned automation later | Letting two orchestrators own branch cleanup |
| Human status | `pi-observability` | sidebar/dashboard packages | Multiple footers/sidebars/cost widgets |
| Remote/mobile | Trial: Linux cmux TUI owner over managed SSH; baseline: cmux Remote tmux with remote tmux durability | Direct iOS-to-Linux only after upstream support is documented; Mosh for phone/flaky networks | Public listeners, relay/Iroh before SSH proves insufficient, or promoting two daily controllers at once |

## Lean Default Batch 2026-08-03

Status: Executed at user scope

Default package owners:

- observability: `pi-observability`,
- web/search: `pi-web-access`,
- code exploration: `pi-lens`,
- persistent PR worktrees: native Git CLI with optional `piwt`,
- subagents and temporary child worktrees: `pi-subagents`,
- implementation taste: `@dietrichgebert/ponytail` at `lite`,
- background commands: `pi-background-tasks@0.6.0`.

Default non-package extensions:

- Pi's bundled plan mode,
- the cmux Pi lifecycle hook.

Remove from the default:

- `@quintinshaw/pi-dynamic-workflows`,
- `@malinamnam/pi-phone`,
- package-bundled skills and prompts that are not needed for normal tool operation.

Repo shape:

- `pi/agent/` and `pi/package-profiles/` are the reproducible source of truth.
- `scripts/apply-pi-setup.mjs` applies the profile to user-level Pi config on a fresh machine.
- `automation/` is reserved for explicit repo-owned routing, loops, and evals; nothing there loads into every Pi session.
- this repo intentionally has no active project-local `.pi/` package list, which
  prevents the user-level packages from loading twice while editing the harness.

Trust and rollback:

- Preserve unrelated global Pi settings and packages.
- Back up `~/.pi/agent/settings.json` before changing it.
- Pin the background-task package because its newer release adds an unrelated always-active multi-model workflow.
- Do not remove skills from `~/.agents/skills`; filter them only for Pi so other harnesses remain unaffected.

Validation:

- all six pinned user packages appear in `pi list`,
- `@season179/pi-worktree` is absent,
- dynamic workflows and Pi Phone are absent,
- the user package audit reports zero vulnerabilities,
- Pi sees six auto-invocable general skills, four Pi Lens guides, and the
  manual-only `zoom-out` skill,
- a fresh second apply completed without changing the selected package set.

## Native Worktree Correction 2026-08-04

Status: Accepted for immediate application

Affected surfaces: worktrees, subagents, safety, and documentation.

Decision:

- remove `@season179/pi-worktree` from the lean profile;
- use native persistent sibling worktrees for concurrent PR lanes;
- publish the optional `piwt <branch> [base]` zsh helper;
- keep one writer per PR worktree;
- allow `pi-subagents` to own temporary child worktrees only when an explicit
  parallel writer run uses `worktree: true`.

Reason: the package creates a real Git worktree but leaves Pi's logical
`ctx.cwd` at the original checkout and redirects only selected built-in tools.
Custom tools and child processes can therefore resolve cwd and artifacts
against the original checkout while parent file tools resolve against the
generated worktree.

Rollback: restore the previous profile/settings backup and re-add the pinned
package only after documenting which subagent workflows are prohibited.

Smoke test:

- apply the profile and confirm `pi list` omits `@season179/pi-worktree`;
- source `~/.config/pi_harness_setup/piwt.zsh`;
- create a test branch/worktree and confirm shell `pwd`, Pi cwd, and subagent
  cwd identify the same directory;
- remove the test worktree explicitly with Git.

## Ubuntu Homelab + tmux Rollout 2026-08-26

Status: Executed; Mac control-plane follow-up completed by ADR 0012 on 2026-08-27

Affected surfaces: remote/mobile, terminal/session, safety, package policy, and documentation.

Goal: reproduce the lean user-level Pi harness on the existing Ubuntu homelab
and run remote Pi sessions inside tmux over Tailscale and SSH. cmux remains the
Mac cockpit; tmux remains the remote persistence boundary.

Decisions proposed for review:

- reuse the current lean Pi profile on both hosts;
- keep credentials and Pi session files host-local and outside Git;
- clone the harness at `~/pi_harness_setup`, matching the requested top-level
  placement;
- install verified Node 24 LTS at user scope because the host's Node 18 cannot
  run the repository-pinned Pi `0.83.0`;
- install tmux as the only required new apt package; keep Mosh and Neovim
  optional;
- leave the working Tailscale configuration unchanged;
- superseded by ADR 0012: cmux Remote tmux is now the primary Mac control
  plane; plain cmux SSH is deprecated;
- add a narrow Ubuntu bootstrap script, runbook, ADR, and cross-links rather
  than forking the Pi package profile prematurely.

Human checkpoints:

- approve the plan and target checkout path;
- enter the sudo password or run the exact apt command in another terminal;
- complete Pi `/login` over interactive SSH without exposing credentials;
- approve the first cmux relay upload before the cmux cockpit smoke test.

Trust notes:

- never commit or copy `~/.pi/agent/auth.json`, API keys, browser state,
  session logs, or machine-generated npm state;
- verify the official Node SHA-256 checksum before extraction;
- do not use `curl | sh` bootstrap commands;
- stop on an unexpected remote checkout, checksum failure, package-audit
  policy finding, or install scope broader than this batch;
- cmux may write a versioned relay under `~/.cmux/bin` on first remote use.

Rollback:

- restore Pi assets from the apply script's timestamped backup;
- restore the previous `~/.tmux.conf`;
- remove only the user-scoped Node/Pi paths and rollout-created test sessions;
- do not alter or remove Tailscale, SSH configuration, credentials, or
  unrelated system packages.

Smoke tests:

- verify Node, npm, pinned Pi, tmux, package list, and npm audit;
- run a harmless authenticated Pi prompt;
- detach and reconnect to the same named tmux/Pi session;
- superseded by ADR 0012: validate cmux Remote tmux without installing the
  plain cmux SSH relay;
- defer Mosh and phone access unless tested explicitly.

Observed:

- `origin/main` commit `b8e30fe` cloned cleanly to `~/pi_harness_setup`;
- Node v24.20.0, npm 11.19.0, Pi 0.83.0, and tmux 3.4 installed;
- all six lean packages installed and npm audit reported zero vulnerabilities;
- ast-grep 0.45.2 and Pi Lens graph build passed on Linux;
- OAuth completed with host-local mode-0600 auth state;
- authenticated smoke returned `homelab-pi-ok`;
- the initial `pi-auth` session validated Pi-in-tmux; ADR 0012 now uses
  `pi-main` through cmux Remote tmux;
- no plain cmux relay is installed.

Superseded follow-up: ADR 0012 owns cmux Remote tmux validation. Mosh and phone
access remain deferred.

Detailed staged plan: `docs/reviews/homelab-linux-rollout-plan.md`.

## cmux Remote tmux Cutover 2026-08-27

Status: Executed on 2026-08-27

Affected surfaces: remote/mobile, terminal/session, UI, and safety.

Decision:

- make `cmux ssh-tmux homelab` the normal Mac attach path;
- retain the remote tmux server as the durability substrate because Remote
  tmux is a `tmux -CC` projection, not a tmux replacement;
- deprecate plain `cmux ssh ... --command 'tmux ...'` as a daily path;
- retain direct SSH/tmux only as break-glass recovery and diagnostics;
- do not install the plain cmux SSH relay as part of this cutover;
- keep phone access on SSH/Mosh + tmux.

Accepted beta limits:

- mirrors require manual reattach after cmux relaunch;
- cmux pane/window mutations change the real remote tmux layout;
- multi-line paste and resized historical scrollback have documented limits;
- focus/lifecycle rough edges remain possible while the feature is beta.

Trust and rollback:

- back up cmux app preferences before enabling the beta;
- no credential or session migration is involved;
- rollback is disabling Remote tmux and attaching to the unchanged tmux server
  through direct SSH.

Smoke test:

- enable Settings -> Beta Features -> Remote tmux;
- create a named `pi-main` session on the homelab;
- run `cmux ssh-tmux homelab` and verify workspace/tab/pane mapping;
- detach with `remote.tmux.detach` (not pane/tab close) and confirm the remote
  session remains alive;
- reattach the mirror and confirm Pi remains interactive;
- verify no plain cmux relay was installed.

Observed:

- enabled the Remote tmux app preference after backing up cmux UserDefaults;
- `cmux ssh-tmux homelab` mirrored `pi-main` into a native workspace;
- the mirror received the live Pi pane output from `~/pi_harness_setup`;
- `remote.tmux.detach` left Pi and the remote session alive;
- reattach restored the same session successfully;
- remote `~/.cmux` remained absent, confirming no plain SSH relay install;
- `--new-window` returned `method_not_found` on cmux 0.64.22, so the supported
  path for this setup omits that flag.

Decision record:
`docs/decisions/0012-adopt-cmux-remote-tmux-as-primary-homelab-control-plane.md`.

## cmux TUI Remote Thin-Client Pilot 2026-08-27

Status: Managed install, reconnect, and multi-client smoke passed; interactive TUI/Pi UX remains in trial

Affected surfaces: remote/mobile, terminal/session, UI, safety, and durability.

Goal:

```text
Mac cmux TUI client
  -> managed SSH over Tailscale
  -> Linux cmux TUI owner (`agents-pilot`)
  -> disposable Pi pilot sessions
```

The pilot tests cmux TUI's own tmux-like owner/client model. The Linux mux owns
its PTYs, workspace tree, and Pi processes; the Mac renders and controls that
state through the Rust TUI. This is separate from the native macOS cmux app and
its Remote tmux projection. Running the TUI inside a native cmux terminal does
not make the remote tree native macOS workspaces or panes.

Trial boundaries:

- use the npm-packaged `cmux@0.11.0` client and its pinned Linux binary;
- start with `npx --yes cmux@0.11.0 remote ssh homelab --session agents-pilot`;
- use existing noninteractive SSH and Tailscale only;
- do not enable public WebSocket, relay, Iroh, Cloud, or port-forward listeners;
- treat the homelab Unix account as the authority boundary because every
  attached client can access every daemon workspace and run commands as that
  user;
- keep existing `pi-main` and other tmux sessions unchanged;
- use only disposable Pi work until rollback and daemon failure are proven;
- keep direct iOS-to-Linux attachment marked `Untested`.

Trust and install notes:

- the managed SSH path requires a trusted host key and key/agent authentication;
- it runs SSH noninteractively with forwarding disabled;
- it may install the compatible remote binary at `~/.local/bin/cmux-tui` and
  create host-local cmux TUI state outside Git;
- source builds are excluded from this pilot because client/server compatibility
  would become operator-owned;
- the repository does not install a systemd service during the first pass.

Rollback:

- detach or stop only `agents-pilot` after quitting disposable Pi processes;
- remove the managed cmux TUI binary/state only after inspecting the exact paths;
- return to `cmux ssh-tmux homelab` and the unchanged `pi-main` tmux session;
- do not claim live-session rollback between cmux TUI and tmux because they own
  different PTYs.

Promotion gates:

1. managed install, create, detach, reconnect, and multi-client behavior pass;
2. Mac/client restart and daemon-side failure behavior are documented;
3. a supervised Linux reboot test proves the intended recovery semantics;
4. upgrade/downgrade and exact version checks are documented;
5. the TUI workflow beats Remote tmux on real daily tasks despite losing native
   workspace/tab/pane projection;
6. only then write a superseding ADR and demote tmux to break-glass recovery.

Managed install, disconnect/reconnect, and concurrent-client smoke tests passed.
The Linux owner is running empty and `pi-main` remains unchanged. Interactive
Pi use, crash/reboot recovery, upgrades, Machines rail, and iOS remain
`Untested`.

- Daily use and implementation: `docs/runbooks/cmux-tui-remote.md`
- Execution log: `docs/trials/2026-08-27-cmux-tui-remote-pilot.md`
- Research synthesis:
  `docs/research/2026-08-27-cmux-tui-remote-thin-client.md`

## cmux Setup Batch

Status: Executed locally and through Remote tmux on the homelab

Goal: make cmux the Mac-native visual interface while preserving tmux as durable session truth.

Candidate contents:

- install or repair cmux cask/CLI,
- back up and merge `~/.config/cmux/cmux.json`,
- add Ghostty rendering defaults,
- add tmux mouse/QOL defaults,
- configure Vim-style pane navigation chords in cmux and tmux,
- install local Pi cmux hook,
- install tmux, mosh, and Neovim,
- verify local cmux config,
- validate `cmux ssh-tmux homelab` as the primary Mac control plane,
- deprecate plain `cmux ssh ... tmux ...` after the mirror passes,
- defer cmux iOS beta until Mac + Tailscale path is stable.

Trust notes:

- cmux is a native macOS app with CLI/socket automation authority.
- Project `.cmux/cmux.json` actions are executable and should be reviewed before trust.
- Plain `cmux ssh` may upload a relay binary under remote `~/.cmux/bin`;
  Remote tmux uses SSH control mode and did not install that relay.
- Phone notifications may send notification text through cmux/Apple push unless hidden-content mode is enabled.

Rollback:

- uninstall cask,
- restore previous `~/.config/cmux/cmux.json`,
- restore previous `~/.config/ghostty/config`,
- restore previous `~/.tmux.conf`.

Executed locally:

- cmux app found at `/Applications/cmux.app`.
- cmux CLI linked to `/opt/homebrew/bin/cmux`.
- Applied repo templates to `~/.config/cmux/cmux.json`, `~/.config/ghostty/config`, and `~/.tmux.conf`.
- Installed `tmux`, `mosh`, and `neovim`.
- Installed cmux Pi hook at `~/.pi/agent/extensions/cmux-session.ts`.
- Validated `cmux config check`, tmux smoke session, and Pi smoke response.

Pending:

- remote Pi lifecycle/feed/notification integration beyond terminal mirroring;
- optional cmux iOS beta after Tailscale Mac-phone path is stable.

## Candidate Build Batch 1

Status: Accepted for initialization on 2026-08-03

Goal: create the boring substrate before adding autonomy.

Candidate contents:

- package profile manifest shape,
- package audit checklist,
- rollback convention,
- secret/log policy,
- cmux/tmux/Tailscale terminal interface notes,
- one local observability/status trial,
- `pi-web-access` trial config with browser cookies disabled.

Open gates:

- choose first observability/status package,
- decide how cmux and tmux divide responsibility,
- define package install/pin/rollback format,
- define where machine-local secrets live.

## Candidate Build Batch 2

Status: Partially accepted for initialization on 2026-08-03

Goal: add code exploration and safe parallel workspace behavior.

Candidate contents:

- `pi-lens` trial,
- one manual worktree package trial,
- `pi-subagents` trial,
- first deterministic RPC/SDK eval skeleton,
- Ponytail implementation/review profile trial.

Open gates:

- choose manual worktree owner,
- decide subagent caps and tool inheritance rules,
- choose a small real repo/task set for eval comparison,
- decide Ponytail default level and when it is off.

## Candidate Build Batch 3

Status: Superseded by the lean-default batch on 2026-08-03

Historical goal: add richer orchestration and remote/mobile surfaces. These
items are no longer approved defaults; retain them as research history only.

Candidate contents:

- one plan-mode owner trial,
- `@quintinshaw/pi-dynamic-workflows` trial with trigger off and hard caps,
- one remote/mobile surface over Tailscale,
- `context-mode` before/after measurement,
- optional Usher comparison if the goal becomes cross-agent remote control.

Open gates:

- finish Batch 1 and Batch 2,
- write remote threat model,
- define fanout budgets and workflow artifact storage,
- decide what measurements make `context-mode` worth keeping.

## Initialization Batch 2026-08-03

Status: Executed locally on 2026-08-03

Install scope: project-local package profile where supported.

Runtime:

- Upgrade global Pi CLI to `@earendil-works/pi-coding-agent@0.83.0`.

Selected package installs:

- `pi-observability`
- `pi-web-access`
- `pi-lens`
- `@season179/pi-worktree`
- `pi-subagents`
- `@quintinshaw/pi-dynamic-workflows`
- `@dietrichgebert/ponytail`
- `@malinamnam/pi-phone`

Explicit exclusions:

- Usher,
- OMP,
- `context-mode`,
- Plannotator,
- hashline/read replacement packages,
- extra sidebar/status packages.

Guardrails:

- Dynamic workflows trigger is disabled after install.
- Dynamic workflows defaults are capped: concurrency 4, retry 1, timeout 30 minutes per agent, token budget 200k.
- Ponytail defaults to `lite`.
- `pi-phone` is only for private Tailscale/local trial.
- Remote/mobile still has one active controller rule.

Validation:

- Pi CLI upgraded to `0.83.0`.
- All eight selected project-local packages installed.
- `npm audit --prefix .pi/npm --omit dev` found zero vulnerabilities.
- Pi loads the repo and returns `harness-smoke-ok` in non-interactive mode.
- `ast-grep 0.45.0` and `pi-lens build-graph` both run.

Local machine adjustment:

- Disabled Pi's bundled example `subagent` symlink at `~/.pi/agent/extensions/subagent`.
- Reversible copy lives at `~/.pi/agent/extensions.disabled/subagent.bundled-example.disabled-20260803`.

## Accumulated Ideas

| Idea | Status | Notes |
| --- | --- | --- |
| Use upstream Pi as base | Decided | OMP is benchmark/trial lane. |
| Package profiles | Decided | `base`, `research`, `parallel`, `remote`, `experimental`. |
| Review gate before build | Decided | This document is the gate. |
| cmux as interface | Trial | Evaluate Linux-owned cmux TUI with Mac as thin client. ADR 0012 Remote tmux remains the accepted fallback until promotion gates pass. |
| Vim-style TUI navigation | Trial | Learn `hjkl`, search, copy mode, and pane movement while keeping mouse/QOL defaults. |
| Web search | Leaning | `pi-web-access` first. |
| Advanced code exploration | Leaning | `pi-lens` first. |
| Worktrees | Decided | Native Git worktrees own persistent PR lanes; `piwt` is the optional convenience function. |
| Subagents | Initialized | `pi-subagents` owns the `subagent` tool; bundled example disabled. |
| Read-only agent archetypes | Trial | Iterate user-scoped `researcher`, `scout`, and `reviewer` around bounded trajectories, evidence discipline, and explicit read-only runtime metadata. Prefer inherited project context and task contracts over same-name project shadows. |
| Deterministic loops | Decided | Repo-owned SDK/RPC/JSON harness. |
| Orchestrator loops | Rejected from default | Build explicit routing and eval runners under `automation/` when repeated work justifies them. |
| Remote phone access | Deferred | cmux iOS currently documents Mac pairing; direct Linux cmux TUI attachment is `Untested`. Keep Tailscale + SSH/Mosh + tmux as fallback. |
| context-mode | Open | Debate with measurement. |
| Ponytail | Initialized | Default is `lite`; use `off` for broad research sessions if needed. |
| `pi-ask-user` | Trial | Candidate UI/decision-gating owner. Catalog version observed: `0.13.1`; extension + bundled skill, zero runtime dependencies, install with `pi install --local npm:pi-ask-user` after source review. Smoke-test searchable selection, freeform/cancel, and print/RPC fallback; use inline mode around terminal images. |

## Agent Archetype Iteration 2026-08-03

Status: Trial approved; versioned prompts updated, global apply and deterministic evals pending

Affected surfaces: subagents, safety, orchestration, and observability.

Trial contents:

- keep `researcher`, `scout`, and `reviewer` as stable user-scoped primitives;
- add `acceptanceRole: read-only` and `completionGuard: false` because all three retain inspection-only `bash`;
- inherit trusted project instructions while keeping fresh child conversation context;
- give each role an explicit trajectory and stop behavior;
- persist large outputs through the parent/runtime `output` contract rather than conflicting child write instructions;
- use project `AGENTS.md` and task contracts for normal specialization;
- reserve same-name project agent definitions for deliberate full shadowing, or use a distinct role name when specialization is substantial;
- validate with the deterministic matrix in `docs/research/2026-08-03-agent-archetype-trajectories.md` before applying stronger global budgets.

No second owner is introduced: `pi-subagents` remains the conversational delegation owner and `automation/` remains the deterministic evaluation owner.

Rollback:

- restore the previous three files under `pi/agent/agents/`;
- re-run the apply script only after prompt evals pass.

## References

- Agent archetype trajectories: `docs/research/2026-08-03-agent-archetype-trajectories.md`
- Package shortlist: `docs/research/2026-08-02-pi-package-shortlist.md`
- Package policy: `docs/decisions/0005-package-adoption-policy.md`
- Initial shortlist decision: `docs/decisions/0006-initial-package-shortlist.md`
- Remote/mobile decision: `docs/decisions/0002-local-homelab-mobile-operating-model.md`
- Subagents, phone, Ponytail, maturity review: `docs/research/2026-08-03-subagents-phone-ponytail-maturity.md`
