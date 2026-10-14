# 0015: Enforce Cross-Host Harness Parity

Date: 2026-10-15
Status: Accepted by owner; host deployment evidence belongs in the operation

## Decision

Mac and Linux are two installations of **one portable harness**. A feature
selected for daily use must enter the versioned shared profile and publication
path, not remain an undocumented permanent host override. This strengthens ADR
0011 and supersedes ADR 0009's active UI selection and blanket package-skill
exclusion. Explicit experiments may differ temporarily, with an owner and a
promotion/rollback decision.

`pi/package-profiles/lean-default.json` owns the exact Pi/package versions and
package resource filters. Pi 1.2.0, Open TUI 0.3.11, neon-sakura from
awesome-pi-themes 1.2.19, and BTW 0.8.0 with its bundled skill are shared.
Observability remains installed but its extensions are disabled. Existing web,
Lens, subagents, Ponytail and background-task pins do not change.

`apply-pi-setup.mjs` owns publication on **each** host. `--check` reports managed
drift without changing files or installing packages; a Git pull is not apply.
Managed settings must win over old local values. Publish all selected skills,
agents, prompts, global guidance, subagent model/capacity, and Open TUI enablement.
Use exact resource filters to retain one owner per surface. Prefer `/btw:ask`
while the main agent works; the upstream skill's writable modes remain explicit.

## Boundary

Mirror the managed feature/configuration baseline, not live directories.
Credentials, OAuth, sessions, browser state, project trust records, generated
npm trees, OS/CPU-specific dependencies, terminal fonts, cmux transport/hooks and
absolute paths stay host-local. Interactive parent model/provider/thinking and
unmanaged user preferences/packages are preserved, not silently copied from a
snapshot of another machine. Open TUI's other layout preferences are currently
unmanaged; promoting one requires adding it to the shared template.

This is not byte-for-byte equivalence of every host file. Both hosts must run
checks after applying the same commit; evidence on one is not evidence on the
other. Report unmanaged differences and untested UI/provider behavior honestly.

## Why

The old bootstrap pinned Pi 0.83 while the hosts used newer versions. Mac UI
and BTW changes stayed in host-only runbooks, BTW's skill was disabled, and
existing settings overrode shared defaults. Apply also omitted the subagent
capacity file. Git was recording changes without enforcing the intended setup.

## Recovery and validation

Back up before modifying managed files or installed packages. Keep prior Pi
runtime trees so active sessions can finish; never synchronize credentials or
restart shared cmux owners to achieve parity. The exact-version host-peer
backport remains necessary for the retained extension pins and must survive
package reconciliation. Validate in an isolated HOME before live publication.

Require convergence/preservation/idempotence tests, a read-only drift check,
and real no-model loader checks for theme validity, skill/command discovery,
schema compilation and TUI identity. Interactive acceptance remains separate.
See [Shared harness sync](../operations/shared-harness-sync.md) for current
commands, backups, deployment evidence and rollback.
