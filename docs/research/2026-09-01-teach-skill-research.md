# Teach Skill Research

Date: 2026-09-01
Status: Current synthesis for a local harness skill

## Question

Build a `teach` skill for Pi that supports two modes:

- maximum-context teaching: slow, source-grounded, useful while reviewing docs/code/work;
- simple teaching: high-level skim for review and orientation.

Special attention: fanout, subagents, unit of work, assumptions, hidden bad design, unnecessary jargon, and failure modes.

## Observed Facts

### Agent Skills load progressively

Agent Skills use `SKILL.md` with required `name` and `description` frontmatter, plus optional scripts, references, and assets. The startup prompt gets only the skill catalog; the full `SKILL.md` loads when activated; supporting files load on demand. This makes a focused instruction-only `teach` skill cheap to keep installed.

Sources:

- Agent Skills specification: <https://agentskills.io/specification>
- Agent Skills integration guide: <https://agentskills.io/integrate-skills>
- OpenAI Codex skills docs: <https://developers.openai.com/codex/skills>
- VS Code Agent Skills docs: <https://code.visualstudio.com/docs/agent-customization/agent-skills>

### Existing `teach` skills split into two families

1. **Persistent course workspace.** Matt Pocock's `teach` skill and the outlinedriven fork treat the current directory as a teaching workspace with `MISSION.md`, `RESOURCES.md`, `learning-records/`, `lessons/`, `reference/`, `assets/`, and `NOTES.md`. The primary unit is a short, self-contained lesson, often HTML, tied to a learner mission and grounded in trusted resources.

2. **Inline comprehension loop.** `code-teacher`, `mentor`, and `professor-teach` focus on one concept, bug, mechanism, or code change. They ask the learner to restate/predict/apply the idea, then grade or adapt. `professor-teach` explicitly says not to run as a background subagent because the learner would only see a summary, not the teaching.

Sources:

- Matt Pocock teach skill: <https://github.com/mattpocock/skills/blob/HEAD/skills/productivity/teach/SKILL.md>
- outlinedriven teach skill: <https://github.com/outlinedriven/odin-claude-plugin/blob/main/skills/teach/SKILL.md>
- Code Teacher skill: <https://github.com/TazShetu/code-teacher-skill>
- Mentor skill: <https://github.com/tempoloss/mentor-skill>
- Professor teach skill: <https://github.com/theadityamittal/claude-professor/blob/main/skills/professor-teach/SKILL.md>

### Good teaching is not just a correct answer

Tutoring failure modes include over-explaining, under-explaining, giving away answers too early, ignoring confusion signals, wrong assumed level, and confidently wrong explanations. Good tutoring diagnoses the learner state, scaffolds from known to unknown, repairs misconceptions, and checks understanding with application or teach-back.

Source:

- Magic EdTech AI tutor benchmark: <https://www.magicedtech.com/blogs/how-to-benchmark-an-ai-tutor-beyond-accuracy/>

### Hidden assumptions are a code-review risk

LLM-generated code often embeds implicit assumptions about input validation, data format, error policy, persistence, performance, and security. These can pass tests while violating intent. Teaching while reviewing should expose assumptions as reviewable claims, not hide them inside a confident explanation.

Source:

- AssumptionMiner paper: <https://arxiv.org/html/2607.22898>

### Pi subagents are useful fanout, but not the teaching surface

`pi-subagents` makes Pi the parent orchestrator and child agents focused workers. It supports single, parallel, chain, async, fresh/forked context, worktrees, intercom, status artifacts, and reviewer/researcher/scout/oracle/worker roles. Its own guidance keeps orchestration authority in the parent, prefers fresh-context reviewers for adversarial review, and keeps writes single-threaded unless worktrees are explicit.

Local sources:

- `~/.pi/agent/npm/node_modules/pi-subagents/README.md`
- `~/.pi/agent/npm/node_modules/pi-subagents/skills/pi-subagents/SKILL.md`
- `~/.pi/agent/npm/node_modules/pi-subagents/skills/pi-subagents/references/execution-controls.md`
- `~/.pi/agent/npm/node_modules/pi-subagents/skills/pi-subagents/references/constraints-and-recipes.md`

## Implications For This Harness

- Make `teach` manual-only. It is valuable but interruptive; over-firing kills the habit.
- Do not build a full course workspace first. This harness wants teaching during review; persistent lesson assets are heavier than needed.
- Use disposable HTML as the teaching primitive: one self-contained temp `.html` file per teach unit, viewed once and deleted.
- In remote cmux SSH sessions, make the artifact viewable through loopback HTTP and `cmux browser open`; terminal Markdown `file://` links are not enough.
- Use one reviewable unit of work: diff, plan, code path, doc section, subagent result, command output, or external doc.
- Keep teaching inline in the parent conversation. Subagents gather evidence and disagreement; the parent writes the teach artifact and teaches.
- Teach mode is not an implementation owner. If fixes are requested, finish the teach/review unit and switch to the normal one-writer implementation flow.
- In maximum-context mode, fan out read-only subagents when breadth matters: `scout` for local map, `researcher` for external docs/specs, `reviewer` for adversarial design critique, `oracle` for inherited decision drift.
- In simple mode, avoid fanout entirely. Give a one-screen map, name assumptions/failure modes, mark risky claims as `unchecked`, and say what max mode would verify.
- Every code reference needs context: role in the flow, why it matters, and what claim it supports.
- Start with zoomed-out system understanding before narrowing to objective and solution method.
- Use diagrams whenever relationships, flow, ownership, state, or before/after behavior is more intuitive visually.
- Bad design must be named directly, with consequence and smallest fix/defer decision.

## Assumptions

- The main learner is a technical user who wants plain language without losing real mechanisms.
- The skill will be used inside Pi, but should remain Agent Skills-compatible for other hosts.
- The skill may write one temp HTML output per invocation, but should not own new tools, scripts, background jobs, or persistent learning state yet.
- A future course/workspace mode can be added only if repeated use shows the need.

## Failure Modes To Guard

- Teaching inside a subagent, so the user only sees a summary.
- Listing files without explaining their role.
- Starting too narrow before stating the high-level system model.
- Using prose where a system diagram would be clearer.
- Introducing jargon before defining it.
- Giving a generic tutorial instead of tracing the user's actual artifact.
- Treating a subagent consensus as truth without primary-source grounding.
- Simple mode pretending to be complete.
- Simple mode quietly using subagents and becoming max mode.
- Maximum-context mode spending lots of tokens without naming what each source proves.
- Hiding bad design as a neutral tradeoff.
- Ignoring stale docs/code disagreement.
- No teach-back or review question, so understanding is assumed rather than checked.
- Writing one-use teaching artifacts into the repo or persistent learning records by accident.
- Returning only a `file://` or Markdown link that the remote cmux terminal cannot open.
- Explaining AI-authored or risky code from memory instead of executable evidence, source, spec, or independent review.
