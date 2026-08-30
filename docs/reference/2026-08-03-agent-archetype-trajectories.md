# Researcher, Scout, and Reviewer Archetype Trajectories

Date: 2026-08-03
Status: Trial design informed by rollout `26a8f791` and three independent agent audits

## Goal

Keep three reusable user-scoped primitives—`researcher`, `scout`, and `reviewer`—stable across codebases while allowing project knowledge to specialize their work without duplicating their core safety and reliability rules.

Canonical term: **project specialization**, not overwrite. A same-named project agent shadows the user agent rather than layering cleanly on top of it.

## Observed Rollout

The neuroscience researcher rollout produced useful local evidence but failed operationally:

- 26 turns, 30 tool calls, 103,419 input tokens, 778,240 cache-read tokens, and $1.11 reported cost;
- SSH—the critical prerequisite—was attempted at tool call 22;
- the explicit “stop if SSH fails” rule was followed by eight more tool calls;
- the report answered all eight questions only partially because remote evidence was unavailable;
- useful final prose existed, but the run failed because a read-only task was classified as requiring a file mutation.

This separates three reliability dimensions that future evals must score independently:

1. **Content success:** are claims supported and is the requested question answered?
2. **Operational success:** did tools, artifact persistence, and runtime gates behave correctly?
3. **Instruction compliance:** were scope, stop, safety, and no-edit constraints followed?

## Archetype Responsibilities

### Researcher

Owns bounded fact retrieval. It should:

- identify the answer target, prerequisite checks, and stop conditions before searching;
- test critical availability/auth/network prerequisites before optional deep work;
- prefer primary and exact sources;
- separate verified facts, inferences, and unknowns;
- stop rather than fill evidence gaps with speculation;
- return complete final text when runtime artifact routing conflicts with child read-only rules.

Project-local information: approved sources, domain evidence hierarchy, remote aliases/roots, forbidden datasets, and task-specific retrieval budgets.

### Scout

Owns compressed codebase reconnaissance. It should:

- read project instructions and entry points first;
- trace the real seam from definition through callers, inputs/configuration, and nearest tests;
- use broad search only to locate candidates, then narrow to exact symbols and paths;
- stop when the next agent has a reliable starting point, flow map, and explicit unknowns;
- avoid becoming a researcher, planner, reviewer, or orchestrator.

Project-local information: domain vocabulary, canonical entry points, generated/vendor exclusions, test commands, and known architecture maps.

### Reviewer

Owns independent falsification. It should:

- compare the original task with the result, evidence, transcript, and runtime metadata available;
- grade content, operational behavior, and instruction compliance separately;
- report only actionable, evidence-backed findings;
- distinguish verified, inferred, and unsupported claims;
- say `No findings.` rather than manufacture style complaints;
- remain read-only; remediation belongs to a separate writer.

Project-local information: domain invariants, severity rubric, required validation, threat model, and test commands.

## Scope Architecture

Preferred order:

1. **User-scoped archetype:** stable role, safety, trajectory, evidence contract.
2. **Inherited project context:** `AGENTS.md`, `CLAUDE.md`, and other trusted project guidance provide codebase-specific facts.
3. **Task contract:** exact goal, allowed paths, success criteria, stop rules, output behavior, and per-run budgets.
4. **Project agent definition:** only when the role truly differs enough to justify a complete shadowing definition.

Project definitions have higher precedence than user definitions. Therefore, a project file named `researcher.md`, `scout.md`, or `reviewer.md` must repeat any global invariants it still needs. Prefer a distinct project role such as `neuro-data-researcher` when specialization is substantial; this makes routing explicit and avoids silent drift.

## Minimum Runtime Defaults

For all three read-only archetypes:

```yaml
acceptanceRole: read-only
completionGuard: false
inheritProjectContext: true
defaultContext: fresh
```

Keep hard tool budgets task-local until evals show one global cap works across real repositories. Preserve `bash` only for inspection; prompts must forbid writes, installs, state changes, broad private-data scans, and unrequested network probing.

Use the runtime `output`/`outputMode` fields for artifact persistence. Do not tell a read-only child both “do not write” and “write exactly this file.”

## Deterministic Eval Matrix

| Archetype | Eval | Pass condition |
| --- | --- | --- |
| Researcher | Stop-on-failure | No tools after a required failing prerequisite except final response. |
| Researcher | Evidence separation | Supported fact, inference, and unknown are labeled with exact evidence. |
| Researcher | Artifact conflict | Child performs no write and returns complete text for runtime persistence. |
| Scout | Entry-point discovery | Project instructions, true entry point, implementation seam, and nearest test are identified. |
| Scout | Caller/data-flow tracing | Shared root seam and relevant callers are reported, not only the named symptom. |
| Scout | Bounded blocked boundary | Auth/network failure causes a scoped handoff without alternate probing. |
| Reviewer | Operational/content mismatch | Useful content and failed runtime classification are graded separately. |
| Reviewer | Unsupported claim | A claim about unread evidence is flagged with transcript/output references. |
| Reviewer | False-positive control | A clean result produces `No findings.` |

Run these under repo-owned `automation/`; conversational `pi-subagents` remains the delegation owner, while deterministic evals remain repository-owned.

## Trial Decision

Iterate the versioned user-scoped prompts for these three roles now. Do not create project-local `.pi/` resources in this harness repository. Validate prompt behavior on deterministic fixtures before applying stronger global budgets or creating same-name project shadows.
