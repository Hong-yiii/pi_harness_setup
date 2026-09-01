---
name: teach
description: Manual teaching/review mode for understanding a codebase, diff, plan, docs, or subagent result. Use only when the user explicitly invokes teach or /skill:teach. Produces one disposable self-contained HTML artifact in simple or maximum-context mode. Avoids contextless code refs, needless jargon, and hiding bad design.
disable-model-invocation: true
argument-hint: "[simple|max] <work/topic/diff/docs/subagent result>"
---

# Teach

Teach while reviewing. The goal is not a pretty explanation; it is that the user
can explain and critique the work without you.

Start by zooming out: state what you understand about the system at a high level,
then narrow to the objective and solution method.

Default to **simple** unless the user says `max`, `maximum context`, `deep`,
`grounded`, or asks to review the docs/sources in detail.

## Mode chooser

- **Simple teach:** skim one artifact, explain the shape, name the important
  assumptions/failure modes, and point to what a max pass would verify. No
  subagent fanout; mark risky or unverified claims as `unchecked` and offer max.
- **Maximum-context teach:** read the primary docs/code/results behind the claim,
  use read-only fanout when breadth helps, reconcile disagreements, then teach
  from evidence.
- If the target is too broad, split it into teach units and start with the
  highest-risk/highest-leverage unit. Ask only if the split is not obvious.

## Output primitive

Both modes produce **one disposable self-contained HTML file**. The chat reply is
only an openable link/command, a one-line summary, and the teach-back question.

- Write to a temp path like `${TMPDIR:-/tmp}/pi-teach/<timestamp>-<slug>.html`.
- In a local terminal, return Markdown: `[Open teach artifact](file:///abs/path.html)`.
- In a remote cmux SSH workspace, prefer serving `/tmp/pi-teach` on
  `127.0.0.1` and returning an HTTP URL like
  `http://localhost:<port>/<file>.html`; cmux browser panes route that localhost
  to the remote host.
- If clickable links are not supported, also print the exact command to open it,
  e.g. `cmux browser open http://localhost:<port>/<file>.html` or
  `xdg-open /abs/path.html`.
- Do not write lessons, learning records, or Markdown session docs unless the
  user explicitly asks for persistent learning state.
- Keep CSS inline. Use tables, anchors, callouts, `<details>`, and diagrams when
  useful.
- Do not load remote scripts/styles. Inline JavaScript only when interaction
  needs it, and never for network calls or data exfiltration.
- Include a small "delete me" footer with the exact `rm <path>` command.
- If file-writing is unavailable, return the full HTML in a fenced code block and
  say it was not written.

## Open flow

After writing the HTML, make it viewable immediately:

1. If `cmux` is available, do not rely on clickable terminal links.
2. Serve the temp directory on remote loopback, reusing an existing server when
   possible:
   `python3 -m http.server <port> --bind 127.0.0.1 --directory /tmp/pi-teach`.
   Prefer `bg_run` when available; otherwise use a shell background process.
3. Prefer port `8765`; if occupied, use the next free high port.
4. Open the artifact in a cmux browser pane:
   `cmux browser open http://localhost:<port>/<file>.html`.
5. Reply with the bare HTTP URL, the exact open command, the temp file path, and
   the teach-back question. Plain URLs are more portable than Markdown links in
   terminal UIs.
6. If `cmux` is unavailable, return a `file://` link plus the local opener command
   (`open`, `xdg-open`, or `gio open`, whichever exists).

## Learner calibration

- Assume a smart user without shared jargon. Simplify wording, not the real
  mechanism.
- Infer the user's level from their prompt. If the level changes what you would
  explain, ask one calibration question before the lesson.
- If a teach-back shows confusion, do not repeat the same explanation. Name the
  misconception, use a smaller example or different angle, then ask one smaller
  follow-up.
- Check application or review judgment, not memorized definitions.

## Unit of work

One teach unit is one reviewable artifact:

- a diff or PR;
- a plan, spec, ADR, runbook, or docs section;
- a code path from entry point to effect;
- a subagent result or worker handoff;
- a command/test/log result;
- an external doc or API behavior.

For each unit, cover exactly this:

1. **What I understand / high-level understanding** — zoomed-out system model,
   with confidence and gaps.
2. **Objective** — what this unit is trying to accomplish.
3. **Solution method** — the approach being used and why.
4. **How it works** — end-to-end flow, not disconnected files.
5. **Assumptions** — what must be true; how to verify; risk if wrong.
6. **Bad design / tradeoffs** — say bad design plainly when it is bad.
7. **Failure modes** — how it breaks, including boring edge cases.
8. **Review next** — the next check, source, test, or question.
9. **Teach-back** — one question that proves understanding or review judgment.

## Grounding rules

- Every code reference needs context: `path:line` + role in the flow + why it
  matters. Never drop a path/name as if it explains itself.
- Use diagrams aggressively. If relationships, flow, lifecycle, ownership,
  dependency, state, or before/after behavior is easier to see than read, draw
  it. Prefer simple inline SVG, Mermaid-like ASCII, or HTML/CSS boxes over prose.
- Every diagram needs a one-sentence caption naming what it proves and what it
  intentionally leaves out.
- Define jargon inline at first use: `idempotent` — safe to retry without doing
  the effect twice.
- Prefer the project's names over invented labels. If the name is bad, say so
  after using the real name.
- Separate **fact**, **inference**, and **opinion**. Do not launder guesses as
  source-backed claims.
- If docs and code disagree, surface the disagreement. Do not pick the nicer
  story.
- If something is bad design, use this shape: `This is bad design because ...` →
  consequence → smallest fix → safe defer condition, if any.
- Teach mode does not own implementation. If the user also asks for a fix,
  finish the teach/review unit, then switch to the normal implementation flow
  with one writer.

## Maximum-context procedure

1. Name the teach unit and expected output.
2. Read relevant local docs first: README, CONTEXT/glossary, ADRs, plans,
   runbooks, changed files, tests, and command output.
3. Use subagents only as evidence fanout, not as the teaching surface:
   - `scout`: local map, source seams, callers, tests;
   - `researcher`: external docs/specs/version behavior;
   - `reviewer`: adversarial review of design, validation, or simplicity;
   - `oracle`: inherited-session decision drift or risky direction check.
4. Keep child tasks read-only. If implementation is requested, do not launch a
   child writer from teach mode; switch to the normal implementation flow after
   the teach/review unit. Prefer fresh context for scouts/reviewers/researchers;
   fork only when session history is the evidence. Do not let children teach the
   lesson.
5. The parent must personally read the load-bearing sources before teaching.
   Subagent agreement is not proof.
6. Reconcile conflicting evidence before explaining. If unresolved, say so.
7. Teach one slice, then ask one teach-back/review question and stop.

HTML sections:

- `<header>`: mode, teach unit, one-sentence purpose.
- `#what-i-understand`: zoomed-out system model, confidence, and gaps.
- `#system-diagram`: diagram of the system/flow/ownership when useful.
- `#objective`: narrowed objective and solution method.
- `#source-map`: table of sources with role, what each proves, and confidence.
- `#story`: plain end-to-end explanation.
- `#review-notes`: bad design, hidden assumptions, failure modes, verification.
- `#teach-back`: one focused question.

## Simple procedure

1. Identify the artifact and likely purpose.
2. Read only the minimum needed to avoid bluffing.
3. Give the one-screen map first, then the critique.
4. Mark anything unverified as `unchecked`, not true.
5. End with one useful review question. Do not turn the skim into a lecture.

HTML sections:

- `<header>`: mode, teach unit, one-sentence purpose.
- `#what-i-understand`: high-level system understanding, confidence, and gaps.
- `#diagram`: the simplest useful diagram for the flow or relationship.
- `#objective`: narrowed objective and solution method.
- `#review`: assumptions, failure modes, and bad design/tradeoffs.
- `#if-you-want-max`: sources/fanout a grounded pass would run.
- `#teach-back`: one focused question.

## Failure modes to actively avoid

- Teaching in a subagent, so the user sees only a summary.
- Creating persistent lesson/workspace files for a one-use review artifact.
- Writing the disposable HTML inside the repo by accident.
- Simple mode quietly turning into max mode through subagent fanout.
- File-name soup: paths and symbols with no role or flow context.
- Starting too narrow before explaining the system shape.
- Prose-only explanations for flows or relationships that need a diagram.
- Jargon-first explanation.
- Generic tutorial examples when the user's own artifact is available.
- Hiding bad design behind neutral wording like "could be improved".
- Treating tests passing as proof that assumptions match intent.
- Treating same-model/subagent agreement as independent verification.
- Simple mode pretending it did maximum-context work.
- Maximum-context mode reading many sources but not saying what each proves.
- Skipping stale-docs-versus-code mismatches.
- Asking "does that make sense?" instead of a diagnostic teach-back question.
- Assuming the learner's level instead of calibrating and adapting.
- Repeating the same explanation when the teach-back shows a misconception.
- Explaining risky AI-authored code from memory instead of executable evidence,
  source, spec, or independent review.
