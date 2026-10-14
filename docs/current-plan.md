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

## cmux Remote Artifact Delivery Migration — 2026-10-15

Status: Executed and published on Mac and homelab; active sessions should `/reload`.

Affected surfaces: remote UI, skills, prompt templates, and operating guidance.
Keep native cmux SSH as the owner; replace obsolete remote CLI-relay assumptions
with the existing cmux-tui session API and native Mac projection. No new relay,
package, global `cmux` alias, socket-policy change, or owner upgrade.

Approved scope:

- validate Linux-initiated browser creation and notification delivery in one
  disposable native SSH workspace, with loopback-only fixtures and deadlines;
- preserve existing terminals/owners and remove only recorded test resources;
- update `teach`, deep-research, and current remote guidance;
- back up and publish only the changed skill, shared reference, and prompt to
  both hosts; do not run full apply or change the remote checkout.

Observed: the Linux-created browser rendered the Linux marker rather than the
same-port Mac decoy; origin loss failed closed. Notification creation/clear
synchronized to the correct native workspace. Test tabs, terminal, workspace,
fixtures, and the exact retained forward were removed. The original terminal
and owner PID/generation remained intact. Native handles changed during initial
reconciliation, so the recipe retains Linux receipts and re-queries native
handles instead of retrying creation.

Validation: Pi skill/template loading and argument expansion passed, with one
manual teach skill and no accidental reference discovery. The exact preflight
resolved the live terminal read-only. `python3 scripts/check-cmux-artifact-delivery.py`
checks shell syntax, six target-resolution cases, and missing/invalid socket
guards. Independent source review found no issues; it did not independently
observe live acceptance. Publication rehearsal checked stale-content abort,
backups, intended files, and unrelated-file preservation. All three published
files on both hosts matched source hashes.

Host-local backups are under
`~/.config/pi_harness_setup/backups/20261015-cmux-delivery-<private-run-id>/`.
The receipt identifies the two previous files and new reference. Rollback restores
only those two files and removes the new `teach/references/artifact-delivery.md`,
after checking for later edits, then `/reload`. No unrelated settings, packages,
credentials, sessions, or legacy relay metadata were changed. The existing apply
script already copies skill directories recursively; no profile entry is needed.

Acceptance, upstream chronology, and untested limits:
[cmux 0.65.1 operations](operations/cmux-upgrade-0.65.1.md).

## Local Open TUI Selection and Background-Task Review 2026-10-14

Status: Decided and configured locally; full interactive acceptance pending.

Affected surfaces: local UI and human-visible status. The user-selected
`pi-open-tui@0.3.11` owns the header/editor/footer and turn stats on local Pi
1.2.0. Retain the existing `neon-sakura` palette, allow only that theme from
`awesome-pi-themes`, and disable its companion extensions. Disable
`pi-observability` extensions to avoid a competing footer; its package/state
remain installed, but `/obs` is unavailable while disabled.

The shared profile and homelab are unchanged. This local override requires
Pi >=1.0 and is not yet a cross-host rollout. Backed-up settings changes passed
exact-delta checks; the selected theme passed Pi's schema. A full profile apply
may re-enable the shared observability owner. Restart/interactive acceptance
and rollback are documented in the linked operation.

The background-task update notice was investigated, not applied:
`pi-background-tasks@0.6.0` remains pinned. Version 2.6.10 supports process-only
mode, but its stale peer range and incomplete latest-Pi compatibility testing
need an isolated Pi 1.2.0 check before a live upgrade. No replacement was chosen,
no peer constraints were forced, and the update notice was not suppressed.

Scope and trust: no new installs by the agent, vendor patches, credential or
session reads, remote changes, or full-profile apply. Live settings remain
host-local. Reproduction, source evidence, validation limits, and selective
rollback: [Open TUI local setup](operations/open-tui-local-setup.md).

## cmux Upgrade Acceptance Trial 2026-10-07

Status: Trial — user approved implementation and a PR; native Mac validation pending.

Affected surfaces: remote/mobile, UI, deterministic automation, and safety.
Native cmux remains the control-plane owner; explicit repo-owned test code is
its acceptance oracle. No ambient extension, installer, CI daemon, or competing
remote controller is introduced.

Build the test-only gate first under `tests/cmux/`, with dependency-free Node
fixtures and unit tests. Drive the native cmux browser rather than counting curl
or a manual SSH tunnel as browser success. Reproduce the 0.65.0 regression using
distinct Mac/Linux markers on the same loopback port, fresh requests, and a
remote-origin shutdown check. Record exact inputs, version evidence, bounded
outcomes, and cleanup. Unknown APIs, missing prerequisites, and unexercised
required gates must remain BLOCKED, never silently pass.

Use an explicitly selected, already-connected SSH workspace; do not bootstrap
or replace its shared helper. Fixtures have independent deadlines and contain
synthetic data only. Preserve existing tabs, terminals, configuration,
credentials, and active sessions. Any reconnect test must be demonstrably
isolated; no shared carrier/app restart is authorized by a smoke-test command.
Receipts stay under ignored `tmp/`, not Git. Hosted CI exercises the harness and
fixtures only, without Mac/homelab credentials or untrusted self-hosted jobs.

The upgrade runbook covers pinned candidates, baseline comparison, genuine
isolation, promotion approval, post-install verification, and migration-aware
recovery. Installer automation follows only after the native verifier is proven
on a Mac; creating a second workspace is not installation isolation. No cmux
upgrade, downgrade, restart, or firewall change is part of this implementation.
Rollback of this source-only trial is reverting its files; completed tests must
remove only their own resources. Native acceptance remains **Untested** until a
real Mac run supplies evidence; simulated CI results cannot authorize promotion.

Implemented source: [`operations/cmux-upgrade.md`](operations/cmux-upgrade.md)
is the runbook; `automation/cmux-upgrade.mjs` labels verification phases and
compares private receipts. The executable gate covers native local/remote browser
identity, origin loss, and owned-resource cleanup. Terminal/Pi, notification,
isolated reconnect, running-app identity, and installation/recovery gates remain
unautomated; every receipt retains `upgradeApproved: false`.

Validation (2026-10-08 SGT): 25 Node self-tests passed on Linux, including the wrong-host oracle,
independent fixture expiry, EOF/forced cleanup bounds, failed-baseline cleanup
regression, and the native CLI's Linux BLOCKED guard. JavaScript syntax, primary
LSP error checks and whitespace checks passed. Independent review found a
comparison loophole in baseline cleanup/control handling; a red regression test
reproduced it and the shared comparison gate was corrected; final re-review found
no issues. No native cmux, SSH, model call, installation or live configuration
change was used for these tests.

## Subagent Parallel Capacity 2026-10-12

Status: Executed on homelab — owner requested 12 concurrent agents and 50 total
agents; interpreted as 50 tasks per batch, with 12 running and the remainder queued.
Existing Pi sessions need `/reload` to adopt the new config.

Affected surface: subagents; Pi Subagents remains the sole owner. Set native
`parallel.maxTasks=50` and `parallel.concurrency=12` in a versioned config and
publish only that file to the homelab. Preserve the default 20-task per-run
ceiling, unlimited session launches, models, tools, depth, and unrelated edits.
Explicit per-call concurrency still overrides the default, subject to the
per-run ceiling; this is not a machine-wide concurrency cap.

Back up any existing config (record absence if new) before publication. Do not
run full apply, install packages, restart sessions, or launch a model fleet.
Verify source/live equality, native config resolution, and a no-model scheduler
check with 50 items and peak concurrency 12. Reload Pi when children are idle
before using the new limits. Keep one writer per checkout; use worktrees for
parallel writers. Provider capacity and 12-agent real workload behavior remain
**Untested**. Rollback removes only the two new fields, preserving later edits;
remove the new config only if it still matches the deployment receipt.

Observed: native loader resolves the published 50/12 values; a 50-item no-model
scheduler check completed with peak concurrency 12. Source/live bytes match;
settings, agent definitions, npm manifests/lockfile are unchanged. Retained check,
absence record and hashed receipt:
`~/.config/pi_harness_setup/backups/20261012T140645Z-subagent-parallel/`.
No live model fleet or restart was performed. Rebuild/publication is a manual
config merge, not full apply; see [parallel capacity operations](operations/initialize-packages.md#subagent-parallel-capacity--2026-10-12).

## Subagent Default Model 2026-10-12

Status: Executed on homelab — owner requested GPT 6.1 Sol for all subagents.

Affected surface: subagents; Pi Subagents remains the owner. Set the native
`subagents.defaultModel` to `openai-codex/gpt-6.1-sol` in versioned and live
user settings. Replace the five role-specific model pins with their existing
thinking levels so all nine discovered agents use the shared default. Preserve
parent model, prompts, permissions, packages, and unrelated local edits.
Back up the six live files first; publish only these configuration changes,
not full apply. Verify registry availability, native discovery for every agent,
source/live equality, and unchanged unrelated settings. No model call or service
restart is required. Roll back only the changed settings field and five agent
files from the backup after checking for subsequent edits. Existing sessions
may need `/reload`; explicit future per-run/project model overrides still win.

Observed: registry lists the exact model; native discovery and this session's
live model mapping resolve all nine agents to Sol. The five role thinking levels
and all unrelated settings are unchanged; deployed agents match source. No model
inference was run (**Untested**). Backup:
`~/.config/pi_harness_setup/backups/20261011T192826Z-subagent-sol/`.
See [model-default operations](operations/initialize-packages.md#subagent-model-default--2026-10-12).

## Coordinated cmux Rollback 2026-10-08

Status: Historical Linux preparation on October 8; Mac rollback completed on
October 9, then superseded by the [0.65.1 upgrade](operations/cmux-upgrade-0.65.1.md)
on October 14. The preparation plan and observations below describe October 8,
not current cutover instructions or live process state.

Affected surfaces: remote/mobile, UI, session recovery, and safety. Target the
official `0.64.25` Mac release and its matching Linux amd64 `cmuxd-remote`
artifact, not an arbitrary older `cmux-tui` revision. `0.64.25` is the issue
reporter's last-working release; this host's older verified helper is `0.64.22`.
End-to-end `0.64.25` behavior is **Untested** here.

Inspect and preserve this Pi session, its detached `cmux-tui` owner, the current
on-disk helper, and the existing `0.64.22` helper. The daemon currently owns a
deleted executable inode: preserve its executable bytes as recovery evidence,
not its memory, credentials or terminal contents. Download and checksum-verify
only the matching legacy helper/manifest into protected storage, then stage the
binary in its version-specific native cmux location without overwriting anything.
Do not stop a shared daemon, replace the active executable, alter relays/sockets,
start a listener, or claim that staging switches the active transport.

The Mac agent must checkpoint active work, back up the app/private settings,
verify the official pinned DMG and embedded helper manifest, and perform the
approved app downgrade from an independent local terminal. Fresh legacy SSH
sessions are required; importing live `cmux-tui` PTYs into the old helper is not
assumed. Verify terminal, remote-browser origin and notification behavior before
calling the rollback working. Keep current helpers/state for recovery; remove a
staged binary only if its recorded hash is unchanged and it has never been
activated. No migration/destructive cleanup or Linux reboot is part of this pass.
Record operations and the pending cutover in the host service registry and a
private handoff. Preserve the unrelated dependency-repair edits and PR worktree.

Observed: official `0.64.25` Linux amd64 helper staged without replacement at
`~/.cmux/bin/cmuxd-remote/0.64.25/linux-amd64/cmuxd-remote`; release digest,
checksum list and manifest agree, and `version` returns `0.64.25`. The original
Rust daemon, Pi process, four workspace IDs and original executable hashes all
remain unchanged. A bounded one-shot stdio hello handshake passed and exited 0;
no persistent legacy daemon, PTY or listener was started. Protected recovery
receipt and executable copies are under
`~/.config/pi_harness_setup/backups/20261008T143017Z-cmux-rollback-lfmwkvn2/`,
with a runnable read-only staging check and a private Mac-agent handoff.
See [coordinated rollback](operations/cmux-rollback.md). The current v1 browser
runner rejects legacy backends by design; its unit CI is not rollback acceptance.
At preparation time, Mac cutover and native terminal/browser/notification
acceptance were pending. The subsequent Mac installation is recorded in the
rollback runbook; native browser acceptance on 0.64.25 remains **Untested**.
Current release evidence belongs to the October 14 upgrade record.

## Homelab Host-Dependency Repair 2026-10-07

Status: Executed — user-authorized dependency-only backport; verified on homelab.

Affected surfaces: web/search, code exploration, subagents, and shared runtime
modules. Keep the existing owners and versions (`pi-web-access@0.17.1`,
`pi-lens@3.8.74`, `pi-subagents@0.40.0`). The inspected host is now Pi `1.0.4`;
this repair does not upgrade Pi or revise the repository's older runtime pin.

Backport only the documented host dependency contract: move `typebox` and
Lens's `@earendil-works/pi-tui` to wildcard peers; normalize Subagents' existing
`pi-ai` peer to `"*"` too. Quarantine the three installed duplicate library
directories without leaving symlinks in their place. A stricter regression
proved even symlinks to the host's physical libraries bypass the bundled Pi
runtime and duplicate its TUI class; that interim attempt was rolled back.
Removal alone breaks Lens's standalone CLI, so preserve its three npm bin
commands with a small standalone-only Node resolution launcher. Its hook maps
the two host peers only within the separate CLI process, never inside Pi.
Test first in a disposable package-tree copy; back up original manifests,
libraries, and bin symlinks outside resource loading paths. Preserve settings,
locks, credentials, session data, unrelated packages, and uncommitted docs.
Do not run full apply, npm reconciliation, or restart active Pi sessions.

Validation: reproduce all three warnings with Pi's native resource loader;
require no warning/load errors, all 20 tool schemas, no native shadow copies,
shared Lens/Pi TUI class identity, and a standalone graph build. Leave a runnable
regression check in `scripts/check-pi-host-peers.mjs`; CLI launcher source is
`scripts/pi-lens-host-cli.mjs`. No model call or persistent worker is needed.
Rollback restores the three manifests, library directories, and original bin
symlinks after checking for later changes. This is a local compatibility
backport: reinstalling these pinned releases restores their original metadata
and copies, so recheck after future package operations rather than claiming
an upstream or lockfile fix.

Observed: final fresh bundled load passes with zero warnings/errors, 20 compiled
tool schemas, no shadow libraries, and identical Lens/Pi TUI classes. Standalone
graph build and analyze-help pass through deployed wrappers. Settings and npm
root/lockfile hashes are unchanged. No model call, persistent worker, or service
restart occurred. MCP/full-session behavior remains **Untested**. The live
interim symlink attempt was fully rolled back before applying the accepted fix;
its failed identity evidence is retained. CLI help alone did not load factories
and is not counted as validation. Backup and final receipts:
`~/.config/pi_harness_setup/backups/20261007T065208Z-host-peers/`.
See the [package runbook](operations/initialize-packages.md#homelab-host-dependency-backport--2026-10-07)
for exact deployed paths, recheck, and drift-checked rollback. Existing sessions
were left running; start fresh Pi processes when convenient.

## Homelab Asset Publication 2026-09-26

Status: Executed on homelab after the user's latest-pull/deploy request

Affected surfaces: user-scoped agents and prompt templates only. Publish merged
commit `3b7f931`: the five standard agents, four delegation templates, and new
`deep-research` template. Pi Subagents remains the delegation owner.

The nine existing destinations match the pre-pull `ac9b65a` baseline; the new
template is absent. Back up all existing destinations before file-only publication.
Do not run bootstrap/full apply, reinstall packages, change settings/skills, or
restart active sessions. Leave observed Node `24.20.0` and Pi `0.84.4` unchanged.
Verify deployed bytes, native template loading/argument expansion, resolved agent
contracts, and a bounded read-only child smoke. Full research/HTML-delivery
behavior remains **Untested**. Roll back the nine existing files from the backup
and remove only the newly added template, then reload Pi.

Observed: all ten deployed files byte-match `3b7f931`; settings and npm package
manifest/lockfile hashes are unchanged. Pi's native loader discovered all five
templates and passed quoted/empty argument expansion and seven-section checks.
Live subagent discovery shows all five revised descriptions and fresh defaults;
a fresh read-only planner child returned the required six-section handoff without
implementing. This does not establish general behavioral or inheritance coverage.
Backup: `~/.config/pi_harness_setup/backups/20260926T090850Z-homelab-assets/`
(nine original files plus `deployment.json`). No daemon or listener was added;
active sessions were not restarted. Use `/reload` for template discovery.

## Deep Research Prompt Trial 2026-09-26

Status: Trial — merged and published on homelab on 2026-09-26; behavioral validation pending

Affected surfaces: prompt templates, subagents, research continuity, safety, and
HTML review delivery. Existing packages retain their authority; no new tools,
skills, agents, or runtime hooks are introduced.

Scope:

- add [`deep-research.md`](../pi/agent/prompts/deep-research.md) for
  `/deep-research <question>`; keep the compact `/research` template unchanged;
- preserve the original goal and current tasks in a durable Markdown scratchpad,
  with separate branch notes and isolated experiments where authorized;
- leave investigation methods flexible while defining seven review landmarks,
  first-principles teaching, evidence references, and revision handling;
- make section 3 show the actual research trajectory, including failures,
  inconclusive attempts, abandoned branches, recoveries, and changes in understanding;
- borrow teach's HTML presentation, not its read-only/disposable-notes restrictions;
- keep generated reports, experiment artifacts, and host-local paths out of this PR.

Design references: [Anthropic's multi-agent research account](https://www.anthropic.com/engineering/multi-agent-research-system),
[its public lead-agent prompt](https://github.com/anthropics/claude-cookbooks/blob/main/patterns/agents/prompts/research_lead_agent.md),
and [OpenAI's deep research guidance](https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt).
These informed continuity, synthesis, and verifiable output; fixed agent counts
and mandatory research procedures were deliberately not adopted.

Publication and rollback:

- the source PR did not modify live Pi; the subsequent user-authorized homelab
  publication is recorded above; do not run the full apply script for this asset-only update;
- after approval, review and publish only this template to
  `~/.pi/agent/prompts/deep-research.md`, backing up any existing destination;
  reload Pi for discovery;
- the full apply script already copies prompt assets for future rebuilds;
  the nine-file subagent publication procedure does not include this new file;
- roll back a later publication by restoring its backup or removing only the
  newly added template, then reload Pi.

Validation: check template frontmatter, argument expansion, the seven report
sections, trajectory/failure coverage, whitespace, and an independent read-only
review. After publication, smoke-test one bounded investigation for scratchpad
resume, branch evidence, honest failed-test reporting, and HTML delivery locally
and through remote cmux. End-to-end research, compaction recovery, and remote
report delivery for this template remain **Untested**; prompt instructions alone
cannot guarantee recovery from an abrupt interruption.

Observed static validation: Pi's template loader parsed the frontmatter and
expanded quoted/multiword and empty arguments; seven-section and trajectory
checks passed. `/research` is unchanged, whitespace checks passed, and diagnostics
reported no issues. Independent review prompted explicit agent discovery and a
finite presentation-server lifetime/cleanup guard; final re-review found no issues.
These checks did not execute a research task or publish the template.

Trust: use existing tool permissions and delegation limits. Isolated directories
are not an OS sandbox. Do not transmit private research material in public web
queries, include secrets in reports, or expose a workspace through a public
listener. Experiments needing broader authority require approval.

## Subagent Contract Update 2026-09-24

Status: Executed locally on 2026-09-26 after user approval

Affected surfaces: subagents, safety, and delegation prompt templates.

Approved scope:

- keep the five existing roles and models; define responsibility and quality
  without mandatory investigation procedures;
- retain explicit handoff sections: scout evidence and starting point, reviewer
  assessment dimensions and evidence labels, researcher sources/uncertainties,
  planner file-level steps/validation, and worker outcome/checks/remaining work;
- put task-specific context, scope, and success criteria in the parent brief;
- enable trusted project-context inheritance and explicit fresh context for
  planner and worker, matching the existing read-only roles;
- give researcher the existing web owner's search/fetch/source-check tools;
- retain worker's normal tool access deliberately for this prompt trial; neither
  its fresh context nor inspection-only bash in other roles is a sandbox;
- preserve the original request through handoffs, inspect blocked results before
  continuing, and let the parent decide which review findings warrant fixes;
- publish only the five agents and four prompt templates at local user scope;
  keep package agents, models, packages, global instructions, settings, skills,
  and the homelab unchanged. Pi Subagents remains the sole delegation owner.

Design references: [Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents),
[Codex role examples](https://learn.chatgpt.com/docs/agent-configuration/subagents#example-custom-agents),
and [Pi's worker example](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/agents/worker.md).
These support a small role prompt plus a concrete task brief, not a prescribed
sequence of tool calls. Broad behavioral effectiveness requires evaluation;
smoke checks alone do not establish general reliability.

Review and validation:

- inspect the five files in `pi/agent/agents/` and four in `pi/agent/prompts/`;
- check frontmatter, template placeholders, whitespace, and an independent
  read-only review; these are static checks, not behavioral validation;
- smoke-test project-instruction inheritance, public-web research, blocked
  handoffs, review behavior, and a worker result with unavailable tests;
- use the backed-up, file-only publication procedure in
  `docs/operations/initialize-packages.md`; do not run the full apply script for
  this batch because it also installs packages and republishes unrelated assets.

Draft validation: YAML frontmatter, role/context fields, template arguments,
and `git diff --check` passed. The initial draft received an independent review;
the user's subsequent review restored useful reporting detail before approval.
All nine live agent/template files matched the pre-update baseline immediately
before publication. Missing-H1 style warnings reflect the existing prompt format.

Observed local publication and smoke checks:

- all nine files were backed up under
  `~/.config/pi_harness_setup/backups/20260926T042213Z-subagent-contracts/`,
  published, and byte-compared with the versioned sources;
- live subagent discovery reports the revised descriptions and fresh defaults;
- planner and worker returned the fixture's inherited project-context marker;
  planner left its file unchanged, and worker changed only the assigned file
  from `pending\n` to `ready\n` and reported the absent integration script as
  unavailable, not passed;
- scout made one read call, observed the missing required entry file, and
  returned its structured blocked handoff without further tool calls;
- researcher successfully fetched the specified IANA public source through its
  web tools and returned a cited answer;
- the independent reviewer found a missing explicit diff-review step in the
  publication runbook. The runbook now displays differences and requires typed
  confirmation before copying; the actual local publication had already checked
  all destinations against the pre-update Git baseline;
- the documented publication command passed isolated-HOME checks for approved
  copies, backups, cancellation without writes, untouched settings, and aborting
  before any copy when a destination is missing;
- final independent re-review (`2afe99bc`) reported `No findings.` and separately
  confirmed the fixture bytes and missing integration script. It did not claim
  broad workflow coverage or independently repeat the live publication.

Evidence: local subagent smoke run `fa9a8d0e-778a-45d6-899d-736d94458d98`;
raw runtime artifacts stay host-local. The worker fixture's inferred acceptance
was `review-required`, not a completed independent-review gate. A scout runtime
log also emitted a cmux resume-binding warning; cmux reconnect behavior was not
validated by this batch. Full workflow/eval coverage remains **Untested**.

Trust and rollback: public-web research must not transmit private repo contents
or access credentials/private services without explicit authorization. Read-only
roles return text rather than writing reports themselves. Before publication,
back up only the nine destination files under
`~/.config/pi_harness_setup/backups/<timestamp>-subagent-contracts/`. Roll back by
restoring those files from that backup, then reload Pi. Do not restore unrelated
settings or packages.

## Public Repository Release Batch 2026-08-31

Status: Executed on 2026-08-31

Affected surfaces: documentation, public presentation, onboarding, repository
metadata, and privacy.

Decision:

- turn the root README into a recruiter-friendly landing page without replacing
  the deeper operating and rebuild documentation;
- lead with the reason for choosing Pi: a small, inspectable runtime lets this
  repository own capability, authority, reproducibility, and rollback;
- show the architecture, selected capability owners, operating loop, tested
  evidence, and honest limits before the installation details;
- include a privacy-safe workspace capture and a repo-native architecture
  visual under `docs/assets/`;
- keep the human documentation index as the primary route into detailed guides,
  operations, decisions, research, and history;
- update GitHub description and topics after the local result passes review.

Trust and scope:

- do not commit the original capture because it contains a workstation name,
  home path, and unrelated project names;
- do not expose credentials, sessions, browser state, private network details,
  or host-local generated state;
- do not change runtime packages or architecture as part of this presentation
  pass;
- preserve the current uncommitted documentation information-architecture work
  and validate it as part of the same public release.

Validation:

- render the README at desktop and narrow widths and inspect the visual hierarchy;
- verify local Markdown links and image references across the tracked tree;
- parse versioned JSON and syntax-check the setup scripts;
- scan tracked content and the staged release for private paths and common secret
  patterns;
- review the final Git diff before committing and pushing.

Observed:

- the root README now leads with the control-oriented Pi rationale, architecture,
  capability ownership, operating loop, recorded proof, and honest untested
  boundary before routing readers into setup details;
- a privacy-safe real workspace capture and a repository-native architecture SVG
  live under `docs/assets/` with provenance notes;
- GitHub-style local renders passed visual review at 1440 px and 760 px widths;
- 113 local Markdown references resolve across 71 files, and the moved
  documentation contains no references to the retired manuals, runbooks,
  research, reviews, or trials paths;
- versioned JSON, Node, Bash, Zsh, SVG, and whitespace checks pass;
- redacted Gitleaks scans report no leaks in the public working tree or the full
  pre-release Git history;
- one historical absolute workstation path was replaced with a portable home-
  relative path;
- the public GitHub description and ten discovery topics now reflect the
  repository's architecture and operating model.

Rollback:

- revert the public-release commit; the underlying guides, operations, ADRs,
  reference notes, history, and versioned harness assets remain independently
  usable.

## Human-First Documentation IA Batch 2026-08-30

Status: Executed on 2026-08-30

Affected surfaces: documentation, onboarding, agent navigation, and bookkeeping.

Decision:

- organize documentation by reader intent: getting started, guides, operations,
  reference, decisions, and history;
- add a human-readable documentation index with short agent routing hints;
- keep ADR chronology under `docs/decisions/`;
- promote the active review gate to `docs/current-plan.md`;
- retain executed plans and trial logs under `docs/history/` as evidence;
- update internal links without changing the meaning of historical records.

Validation:

- all tracked Markdown links resolve after the move;
- no tracked documents remain in the old manuals, research, reviews, runbooks,
  or trials directories;
- README, CONTEXT, AGENTS, and the documentation index describe the same reader
  paths.

Observed:

- all documentation moved into the accepted reader-intent structure;
- local Markdown links and `docs/` path references resolve across 48 files;
- the previous manuals, runbooks, research, reviews, and trials directories are
  absent from the tracked documentation tree;
- ADR 0014 records the durable information-architecture decision.

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
| Terminal/session interface | Native `cmux ssh homelab` is the primary Mac-to-homelab path over Tailscale/SSH. | Linux cmux-tui owns detachable PTYs/resources; native Mac projection replaces legacy CLI-relay assumptions. Remote tmux remains break-glass recovery. |
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
| Remote/mobile | Native cmux SSH on Mac; cmux iOS companion through the Mac; SSH/Mosh + tmux fallback. | Direct iOS-to-Linux remains `Untested`. `pi-phone` and Usher remain excluded. |
| Minimalism/taste | Ponytail remains in the default at `lite`. | Its bundled command skills are hidden from the default skill catalog. |
| Background commands | Add a focused background-task owner. | Pin `pi-background-tasks@0.6.0`; later releases add unrelated always-on orchestration. |
| Skills | Eight general skills. | `diagnose`, `caveman`, `grill-with-docs`, `handoff`, `teach`, `to-prd`, `to-issues`, and `zoom-out`. Pi Lens also injects four tool-specific guides that cannot be filtered without disabling or forking Pi Lens. Other package skills are disabled. |
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
| Remote/mobile | Native `cmux ssh homelab` | Mosh transport and cmux iOS after separate validation | Public listeners, TUI nesting, or multiple promoted daily controllers |

## Teach Skill Trial 2026-09-01

Status: Accepted for source addition; user-scope apply pending

Affected surfaces: skills, subagents, code review, safety, and documentation.

Decision:

- add a manual `teach` skill to the shared skill shelf;
- keep it instruction-only with no scripts, packages, tools, or persistent
  workspace state;
- support two modes: simple high-level skim and maximum-context grounded review;
- make one teach unit a reviewable artifact: diff, plan, docs section, code
  path, subagent result, command output, or external doc;
- make disposable self-contained temp HTML the output primitive for both modes;
- include a cmux-friendly open flow: open local temp HTML with direct
  `file://`; only for remote cmux SSH, serve `/tmp/pi-teach` on remote loopback,
  open the HTTP URL with `cmux browser open`, and label bare loopback URLs as
  cmux-remote-browser-only;
- use subagents only as read-only evidence fanout in maximum-context mode; the
  parent conversation remains the teaching surface;
- keep implementation outside teach mode; if fixes are requested, switch to the
  normal one-writer implementation flow after the teach/review unit;
- start each artifact with `what I understand` / high-level system
  understanding, then narrow to objective and solution method;
- require diagrams whenever flow, ownership, state, relationships, or
  before/after behavior is easier to see than read;
- require explicit assumptions, failure modes, design critique, and one
  teach-back/review question per unit.

No second owner is introduced: `pi-subagents` still owns delegation,
`pi-lens` still owns code exploration, and `teach` only guides how the parent
explains and reviews work.

Trust and rollback:

- no executable skill assets were added;
- teach invocations may write one disposable temp HTML file, not repo docs or
  persistent learning state;
- remove `skills/teach/`, the `teach` profile entry, and the settings allowlist
  entry to roll back;
- restart Pi after applying because skill discovery is session-start behavior.

Smoke test:

- run `node scripts/apply-pi-setup.mjs` when ready to publish the skill to
  `~/.agents/skills`;
- restart Pi and confirm `/skill:teach simple <target>` loads the skill;
- run one simple pass on a small diff and one maximum-context pass on a doc/code
  path with read-only subagent fanout; confirm both produce temp HTML only and
  open in a cmux browser pane from a remote workspace.

Research: `docs/reference/2026-09-01-teach-skill-research.md`.

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

Status: Executed; Mac control-plane follow-up completed by ADR 0013 on 2026-08-27

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
- superseded by ADR 0013: native cmux SSH is now the primary Mac control plane;
  ADR 0012 Remote tmux is fallback;
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

Superseded follow-up: ADR 0013 owns native cmux SSH validation. Remote tmux is
fallback; Mosh and phone access remain deferred.

Detailed staged plan: `docs/history/homelab-linux-rollout-plan.md`.

## cmux Remote tmux Cutover 2026-08-27

Status: Executed, then superseded by ADR 0013 on 2026-08-27

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

Status: Rejected after comparison; pilot removed

The Rust cmux TUI passed managed install, disconnect/reconnect, owner restart,
and concurrent-client tests. It was not promoted because it duplicated the
native cmux control surface, introduced a nested sidebar/keybinding model, and
lost native Feed, browser, notification, and iOS-companion integration.

The empty `agents-pilot` owner was stopped. Its managed binary and remote state
were removed. Historical evidence remains in
`docs/history/2026-08-27-cmux-tui-remote-pilot.md`.

## Native cmux SSH Cutover 2026-08-27

Status: Accepted and executed by ADR 0013

Affected surfaces: remote/mobile, terminal/session, UI, safety, and durability.

Decision:

- make `cmux ssh homelab` the single normal Mac attach path;
- let versioned `cmuxd-remote` own detachable Linux PTYs;
- retain native workspaces, panes, Feed, notifications, browser routing, and Mac
  shortcuts;
- keep Remote tmux and direct SSH/tmux only as break-glass recovery;
- retain both trial logs under `docs/history/`.

Validation:

- actual keepalive arguments matched documented values;
- remote carrier and local SSH failures reattached to the same remote PID;
- native remote notifications and homelab browser routing passed;
- a real Pi prompt returned `native-cmux-ssh-pi-ok` and retained the same PID
  after forced reconnect;
- disposable workspaces and helpers exited cleanly;
- tmux `pi-main` remained unchanged.

Remaining `Untested`: full native-app relaunch, Mac sleep/wake, Mosh, remote
reboot, and iOS.

Decision: `docs/decisions/0013-adopt-native-cmux-ssh-as-primary-homelab-control-plane.md`.
Runbook: `docs/guides/cmux-ssh-remote.md`.
Execution log: `docs/history/2026-08-27-native-cmux-ssh-pilot.md`.

## cmux 0.65.1 Coordinated Upgrade — 2026-10-14

Status: Executed with user-approved checkpointing and private rollback backups.

Mac 0.65.1 (110) and its matching Linux cmux-tui helper are installed. Fresh
native SSH, terminal I/O, public browsing, HTTP Linux-origin versus same-port
Mac-decoy checks, origin-loss failure, and OSC notifications passed. Disposable
test resources were cleaned up; old durable session owners remain preserved.

The October 9 rollback to 0.64.25 is historical, not the current version.
Manual native evidence does **not** validate the separate automated acceptance
runner or produce its baseline/candidate/post-install receipts. Its native
execution remains Untested. No assertions or backend guards were weakened.

The October 15 batch validated Linux session-API delivery instead of repairing
the legacy `cmux` wrapper. Open: automatic Pi hooks, full app quit/crash cleanup,
reconnect/sleep-wake on this release, and broader browser HTTPS/WebSocket cases.
Keep auto-updates disabled until a separately reviewed upgrade; do not retire
old session owners without accounting for their dependents and recovery paths.

Execution: `docs/operations/cmux-upgrade-0.65.1.md`.
Historical rollback: `docs/operations/cmux-rollback.md`.

## cmux Setup Batch

Status: Executed; remote-control portion superseded by ADR 0013

Goal: make cmux the Mac-native visual interface for local and remote work.

Candidate contents:

- install or repair cmux cask/CLI,
- back up and merge `~/.config/cmux/cmux.json`,
- add Ghostty rendering defaults,
- add tmux mouse/QOL defaults,
- configure Vim-style pane navigation chords in cmux and tmux,
- install local Pi cmux hook,
- install tmux, mosh, and Neovim,
- verify local cmux config,
- validate native `cmux ssh homelab` as the primary Mac control plane,
- retain `cmux ssh-tmux homelab` only as fallback,
- defer cmux iOS beta until Mac + Tailscale path is stable.

Trust notes:

- cmux is a native macOS app with CLI/socket automation authority.
- Project `.cmux/cmux.json` actions are executable and should be reviewed before trust.
- Native `cmux ssh` installs a manifest-verified helper under remote
  `~/.cmux/bin`; Remote tmux uses SSH control mode instead.
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

## Hunk Review UI Batch 2026-08-27

Status: Accepted and executed locally; isolated Ubuntu bootstrap validated on 2026-08-29

Affected surfaces: UI, code review, and safety.

Decision:

- adopt Hunk as an opt-in terminal review UI for working trees and commits;
  `0.20.0` is the validated version;
- keep Git as source control and stock Pi plus `pi-lens` as code-review owners;
- use Hunk's bundled skill only when a human has opened a Hunk review session;
- do not add the skill to Pi's ambient catalog or replace the global Git pager;
- install from Homebrew core on macOS and pinned `hunkdiff` npm on the Ubuntu
  user-scoped Node runtime.

Fit: Hunk adds a human-visible full-changeset stream and spatial agent comments
without registering Pi tools, prompts, or extensions during normal sessions.
It therefore complements rather than duplicates the current high-authority
owners.

Trust and rollback:

- Hunk has local repository read access and uses a loopback session daemon for
  agent interaction;
- STML remains experimental and disabled;
- uninstall with `brew uninstall hunk` on macOS or the managed-link cleanup in
  `docs/guides/hunk.md` on Ubuntu;
- do not use `hunk update`; review Homebrew upgrades and change the pinned Ubuntu
  package through this repository.

Smoke test:

- `hunk --version` reports `0.20.0`;
- `hunk --help` succeeds;
- `hunk diff` opens the current working-tree review;
- `hunk skill path` locates the version-matched agent skill;
- the full bootstrap passed in an isolated homelab Ubuntu `HOME`, reporting the
  pinned Node, Pi, Hunk, and tmux versions without changing the live runtime.

Runbook: `docs/guides/hunk.md`.

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
| cmux as interface | Decided | ADR 0013 adopts native `cmux ssh homelab`; Remote tmux is fallback and the TUI pilot is removed. |
| Vim-style TUI navigation | Trial | Learn `hjkl`, search, copy mode, and pane movement while keeping mouse/QOL defaults. |
| Web search | Leaning | `pi-web-access` first. |
| Advanced code exploration | Leaning | `pi-lens` first. |
| Worktrees | Decided | Native Git worktrees own persistent PR lanes; `piwt` is the optional convenience function. |
| Subagents | Initialized | `pi-subagents` owns the `subagent` tool; bundled example disabled. |
| Agent contracts | Decided | The September contract update covers all five user-scoped roles: flexible methods, explicit handoffs, inherited project context, and task-specific briefs. Bash-enabled read-only roles remain instruction-constrained, not sandboxed. Broader deterministic evals remain pending. |
| Deterministic loops | Decided | Repo-owned SDK/RPC/JSON harness. |
| Orchestrator loops | Rejected from default | Build explicit routing and eval runners under `automation/` when repeated work justifies them. |
| Remote phone access | Deferred | cmux iOS pairs with the Mac and may view native SSH workspaces; keep Tailscale + SSH/Mosh + tmux as fallback until tested. |
| context-mode | Open | Debate with measurement. |
| Ponytail | Initialized | Default is `lite`; use `off` for broad research sessions if needed. |
| Teach skill | Trial | Manual instruction-only teaching/review skill with simple and maximum-context modes; each run emits one disposable temp HTML artifact, starts zoomed-out, and uses diagrams heavily; parent teaches while subagents gather read-only evidence in max mode. |
| `pi-ask-user` | Trial | Candidate UI/decision-gating owner. Catalog version observed: `0.13.1`; extension + bundled skill, zero runtime dependencies, install with `pi install --local npm:pi-ask-user` after source review. Smoke-test searchable selection, freeform/cancel, and print/RPC fallback; use inline mode around terminal images. |

## Agent Archetype Iteration 2026-08-03

Status: Historical trial; superseded by the Subagent Contract Update above. The deterministic eval matrix remains pending.

Affected surfaces: subagents, safety, orchestration, and observability.

Trial contents:

- keep `researcher`, `scout`, and `reviewer` as stable user-scoped primitives;
- add `acceptanceRole: read-only` and `completionGuard: false` because all three retain inspection-only `bash`;
- inherit trusted project instructions while keeping fresh child conversation context;
- give each role an explicit trajectory and stop behavior;
- persist large outputs through the parent/runtime `output` contract rather than conflicting child write instructions;
- use project `AGENTS.md` and task contracts for normal specialization;
- reserve same-name project agent definitions for deliberate full shadowing, or use a distinct role name when specialization is substantial;
- validate with the deterministic matrix in `docs/reference/2026-08-03-agent-archetype-trajectories.md` before applying stronger global budgets.

No second owner is introduced: `pi-subagents` remains the conversational delegation owner and `automation/` remains the deterministic evaluation owner.

Rollback:

- restore the previous three files under `pi/agent/agents/`;
- re-run the apply script only after prompt evals pass.

## References

- Agent archetype trajectories: `docs/reference/2026-08-03-agent-archetype-trajectories.md`
- Package shortlist: `docs/reference/2026-08-02-pi-package-shortlist.md`
- Package policy: `docs/decisions/0005-package-adoption-policy.md`
- Initial shortlist decision: `docs/decisions/0006-initial-package-shortlist.md`
- Remote/mobile decision: `docs/decisions/0002-local-homelab-mobile-operating-model.md`
- Subagents, phone, Ponytail, maturity review: `docs/reference/2026-08-03-subagents-phone-ponytail-maturity.md`
