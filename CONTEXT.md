# Context

## Goal

Build a reproducible personal harness for Pi that can be recreated from this repo on a local workstation and remote homelab.

## User Preferences

- Research and understanding are more important than immediate execution.
- The harness should support both local and remote use.
- Observability is required.
- Phone interaction is desirable.
- Vim/neovim are not current habits, but learning them is acceptable if it improves TUI workflows.
- Config should be documented and reconstructable from this repo.

## Working Hypothesis

The best shape is a layered harness:

1. **Versioned portable config:** settings, global guidance, agents, prompts.
2. **Terminal/session substrate:** tmux and/or cmux, SSH, mosh, Tailscale/WireGuard.
3. **Observability:** Pi extension telemetry plus session/process heartbeat.
4. **Mobile control surface:** phone terminal attaches to durable remote/local tmux sessions and receives notifications.
5. **Optional richer tools:** MCP, web access, subagent package, context/memory packages, editor integration.

## Current Lean

- Use native `cmux ssh homelab` as the single normal Mac-to-homelab path over
  Tailscale.
- Let Linux's cmux-tui owner keep detachable PTYs and shared resources while
  macOS projects native workspaces, Feed, browsers, and notifications. Since
  0.65.0, managed SSH no longer depends on the legacy cmuxd-remote CLI relay.
  Linux automation uses the inherited session socket and terminal identity.
- Keep Remote tmux and direct SSH/tmux only as break-glass recovery for existing
  sessions.
- Mirror the managed harness on Mac and Linux using one versioned profile:
  Pi 1.2.0, Open TUI, neon-sakura, BTW commands and its skill, and the existing
  web/Lens/subagent/Ponytail/background owners. Keep credentials, package state,
  sessions, interactive parent model choices and OS paths host-local. Run check
  and apply on each host; pulling Git alone does not publish. See ADR 0015 and
  `docs/operations/shared-harness-sync.md`.
- Use Mosh for phone/flaky-network use.
- Prefer OTEL-compatible observability for traces, plus heartbeat/status telemetry for "what is running now?"
- Avoid public web terminals at first.
- Keep Neovim as the preferred learning editor on machines we control, with plain Vim literacy for minimal servers.
- Keep upstream Pi as the documented base for now; trial OMP separately because it is a fork with core behavior, not just a package preset.
- Bring Pi packages in through named profiles (`base`, `research`, `parallel`, `remote`, `experimental`) rather than a single giant install.

## Open Questions

- Which observability backend should be default: local Jaeger, Grafana LGTM, Sentry, LangSmith, or a layered approach?
- Should phone access target local Mac, homelab, or both?
- What exact subagent caps/tool inheritance defaults should become policy?
- How far should Neovim setup go before it becomes too much editor distribution work?
- Is the homelab host a Raspberry Pi, a mini PC, or a server/VM? Hardware affects monitoring and thermal runbooks.
- Can OMP be made reproducible and observable enough for homelab use without losing the repo-as-source-of-truth goal?
- Which real-project friction is strong enough to justify the next package?
- What first repeated workflow is stable enough to encode under `automation/`?

## Current Package Shortlist

The current draft shortlist is captured in:

- `docs/reference/2026-08-02-pi-package-shortlist.md`
- `docs/decisions/0006-initial-package-shortlist.md`
- `docs/reference/2026-08-03-subagents-phone-ponytail-maturity.md`

Current refinements:

- `pi-subagents` owns conversational delegation and explicit temporary child worktrees.
- Native Git worktrees own persistent PR lanes; start Pi inside each real worktree, optionally through `piwt`.
- Pi Phone, Usher, and dynamic workflows are outside the lean default.
- Ponytail stays at `lite`; its bundled skills are filtered from the normal catalog.
- Ten shared skills are versioned in `skills/`; `teach` emits disposable
  temp HTML. BTW contributes its enabled bundled skill; Pi Lens contributes four
  tool-specific guides. Use `/btw:ask` while the main agent works.
- Ubuntu homelab rollout is executed: top-level repo checkout, user-scoped
  checksum-pinned Node/Pi, shared lean profile, authenticated smoke, and Pi
  running inside a named tmux session all passed.
- ADR 0013 adopts native `cmux ssh homelab`; local and remote carrier failures,
  a real Pi reconnect, native notifications, and remote browser routing passed.
- ADR 0012 Remote tmux remains historical validation and break-glass recovery.
- The standalone Rust cmux TUI pilot was decommissioned after comparison; this
  differs from the `cmux-tui` backend bundled with native cmux.
- Historical 0.65.1 manual evidence covers fresh SSH, terminal, public-browser,
  Linux-origin/decoy/origin-loss and notifications; old owners were preserved
  during that earlier pass. See `docs/operations/cmux-upgrade-0.65.1.md`.
- The 2026-10-16 maintenance window installed **Mac cmux 0.65.2 (111)** and its
  signed-manifest-selected Linux helper **`a9b104f3…`**, after official artifacts
  became available. Private recovery copies were retained; 23 verified old Linux
  cmux processes were retired under renewed maintenance authorization. Fresh SSH,
  Pi startup, session-API notifications, same-process explicit reconnect and the
  shared-browser viewer/input path passed targeted manual checks. The automated
  routing runner failed surface ownership/readiness/cleanup checks; it is not an
  accepted upgrade gate. Its disposable Linux workspace required scoped cleanup
  before fresh SSH worked again. No private state/profile tree was reset. See
  `docs/history/2026-10-16-cmux-maintenance.md` for evidence and limits.
- `teach` and deep-research share `skills/teach/references/artifact-delivery.md`:
  local Mac files open directly; Linux uses a bounded loopback server and
  session API browser creation, not `cmux browser open` through a stale relay.
- ADR 0016 assigns the shared Linux browser to an on-demand user systemd service,
  with a thin Pi client and separate `shared-browser` / native `cmux-browser`
  skills. Pi reload does not own the browser lifetime. See
  `docs/operations/shared-browser.md` for deployment and acceptance status.
- Session-preserving native-app relaunch, Mac sleep/wake, Mosh, iOS, remote reboot, and
  direct rather than DERP Tailscale connectivity remain `Untested`.
- The main operating manual is `docs/guides/pi-harness-workflow-manual.md`.
- The first-project guide is `docs/getting-started/first-real-project.md`.
- Hunk is the opt-in human review UI for local changesets; Git remains source
  control and its bundled agent skill is loaded only when a Hunk review is open.

## Review Gate

Use `docs/current-plan.md` as the living gate before build/configuration batches.

Ideas accumulate there first; once a batch is reviewed, implement it in one coherent pass with rollback and smoke-test notes.
