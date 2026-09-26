---
description: Investigate freely and deliver an evidence-linked HTML research report with first-principles teaching and research trajectory
argument-hint: "<question or topic>"
---
# Research with me; teach me what you learn

Research: $@
Use the conversation's relevant context, intended decision, boundaries, and budget. If no research question is available, ask for it rather than inventing one.

Your job is to investigate well and make the work easy for me to understand, challenge, and continue. Choose your own research methods. Be rigorous about evidence and presentation, not ritualistic about process.

## Keep the investigation recoverable

Maintain a main Markdown scratchpad in a durable research workspace. Keep the original request, goals, constraints, current understanding, open questions, task/branch status, artifact locations, and next actions easy to recover. Update it at meaningful checkpoints and before compaction or handoff when possible; read it when resuming. Keep its path in handoffs. Preserve consequential hypothesis changes with links to evidence, rather than overwriting the history with the final answer. It is a working state record, not a transcript of private reasoning.

## Give exploration room

Discover the available agents and tools before delegating; use only enabled roles within their permissions and runtime limits. Use subagents to pursue distinct questions, competing explanations, or experiments in parallel where this adds value. Give them the shared goal and boundaries, but let them choose approaches, follow surprising evidence, and disagree. Let breadth and depth respond to findings; do not force a fixed team, number of rounds, or consensus.

Each branch should leave its own Markdown notes and relevant sources, code, and results in a separate location. Use write-capable agents only in isolated scratch directories or worktrees; save read-only agents' returned notes through the parent/runtime. Respect actual tool permissions. Experiments must stay within the authorized scope; ask before destructive, costly, sensitive, or externally visible actions.

The main agent owns synthesis: check the evidence supporting important conclusions, reconcile disagreements where possible, and preserve useful dissent. Agreement between agents is not independent proof. Stop when further work is unlikely to materially improve the answer, or a budget/boundary is reached; explain what remains unresolved.

## Teach the research, not just the conclusion

Assume I am intelligent but do not share your vocabulary. Start with the bigger picture and build from the simplest relevant concepts to the actual mechanism. Define jargon when introduced. Use small examples, diagrams, and counterexamples to build intuition; explain where an analogy stops working. Do not skip an important concept because it seems elementary.

Tell a truthful discovery story: what we initially suspected, why that hypothesis was plausible, what evidence or test could distinguish it from alternatives, what was observed, and how the documented interpretation changed—or did not change. Include useful failures and dead ends, not every tool call. This should be an evidence-backed account of decisions and learning, not invented inner monologue or a tidied-up story of inevitable success.

For consequential claims, distinguish observation, source-backed fact, inference, and proposal. Put supporting references beside the claim and explain what they establish. For experiments, preserve enough setup, commands/code, and results to reproduce them, together with limitations. Clearly distinguish executed tests from proposed tests, and synthetic examples from real-world measurements. Explain confidence and what could change the conclusion.

## Output document contract

Deliver a self-contained HTML report that lets me orient quickly, learn deeply, and audit selectively. The following controls the deliverable, not your research sequence. Organize the actual investigation however the evidence requires.

### Presentation controls

Use these defaults unless I override them:

- Teaching depth: first-principles, maximum relevant depth; no assumed specialist vocabulary.
- Narrative: guided discovery, not a textbook followed by a tool log.
- Emphasis: balanced between understanding the subject and judging the conclusion. If I name a decision, emphasize its consequences and tradeoffs.

Depth means explanatory completeness, not a word-count target. Keep important qualifications visible at every depth.

### Reading layers

- Orientation: a short opening that stands alone without misleading simplification.
- Main narrative: a coherent explanation I can read without opening every appendix.
- Audit layer: linked evidence, source passages, reproduction details, and branch artifacts.

Use the seven landmarks below in this order. Titles and subheadings may suit the subject. These are coverage requirements, not a repeated worksheet for every paragraph. Where something was not investigated or does not apply, say so briefly instead of inventing content.

### 1. Research brief and current answer

State the question in my terms, why it matters, scope, and what is outside scope. Give the current answer or explicitly state that it is unresolved. Name the most consequential caveat and why the conclusion deserves its stated confidence. Include report date/version and a compact contents list.

On revisions, add a short “Changed since the last review” note distinguishing new evidence, changed conclusions, and presentation-only changes. Do not imply progress that did not occur.

### 2. The mental model

Establish the minimum foundations needed to follow the investigation, including elementary concepts when they matter. Explain the system boundary, important parts, relationships, and relevant constraints. Use a diagram when it clarifies flow, ownership, causality, or state; caption what it shows and omits.

For important mechanisms, connect a plain-language explanation, a concrete example, and the conditions under which the explanation holds. Define technical terms at first use. Separate useful analogies from literal mechanisms. Introduce further concepts where the story needs them rather than front-loading an encyclopedia.

### 3. The investigation story and research trajectory

Show how the research evolved over time—not just the successful path to the final answer. Organize the explanation around consequential questions and turning points, not agents or tool calls.

#### Trajectory: where we started, what happened, where we turned

Include an evidence-linked chronological timeline of meaningful checkpoints. Use recorded dates/times when available; otherwise use sequence labels without inventing timestamps. For each checkpoint, show:

- Starting position: the question, hypothesis, or uncertainty at that point, and why it seemed worth pursuing given what was known then.
- Attempt: what was explored or tested, the alternatives considered, and what observation could distinguish them.
- Outcome: what actually happened, linked to the source, experiment, or branch artifact.
- Update: what changed in the documented understanding or confidence, what did not, and why.
- Next direction: what was continued, revised, split into branches, merged, paused, or abandoned as a result.

Represent parallel inquiries as overlapping branches rather than inventing a single sequential path. Show where their evidence converged or remained in conflict. A compact branch map may accompany the timeline when it makes this easier to follow.

#### Failures, dead ends, and recoveries

Make consequential unsuccessful paths visible within the trajectory. Explain what was expected, what failed or remained uninformative, what the evidence permits us to conclude, and what happened next. Distinguish:

- a hypothesis contradicted by evidence;
- a test or tool that failed to produce usable evidence;
- an inconclusive result or unsuccessful search;
- an approach stopped because of scope, cost, access, or time;
- an idea considered but never tested.

A failed test setup does not refute a hypothesis; finding no evidence does not establish absence. State whether the failure's cause is known, suspected, or unresolved. Record a retry, workaround, or abandonment when it mattered, and whether it actually resolved the problem. Do not force every failure into a useful lesson or every checkpoint into progress.

#### Where the trajectory leaves us

Close with the contrast between the initial and current understanding: assumptions overturned, ideas retained or narrowed, unresolved branches, and the observations responsible for those changes.

Capture consequential checkpoints in the working scratchpads as research proceeds, including expected outcomes before tests when possible. The report may reorder explanations for teaching, but its trajectory must preserve the recorded sequence and distinguish observations from retrospective interpretation. Acknowledge gaps in the record; do not invent a cleaner history. Summarize routine retries and omit unrelated tool chatter, never failures that materially limit the conclusion.

### 4. Findings and their support

State the major findings in plain language, with stable references such as F1 and F2. For each, make clear its supporting evidence, important counterevidence, applicable conditions, and confidence with a reason. Distinguish directly observed results, source-backed claims, inferences, and proposals.

Link findings to the relevant experiment or source record. A citation should support the nearby assertion, not just discuss the same topic. If several agents or articles rely on the same underlying source, do not count them as independent corroboration.

### 5. Synthesis and implications

Explain how the findings fit together and answer the original question. Compare the strongest live alternatives under relevant criteria without inventing numeric scores. Separate what the evidence supports from what you recommend or prefer.

Explain when the conclusion applies, when it fails, and what would change it. If the evidence cannot select a winner, preserve that outcome. For exploratory research, describe the improved understanding rather than forcing an implementation recommendation.

### 6. Open questions and review

Distinguish uncertainty that could change the answer from interesting follow-up work. For each consequential gap, explain its impact and the next useful observation or test; clearly label proposed work as not run.

End the main narrative with a short review agenda: what I should challenge, what decision—if any—is mine, and one question that tests application of the central idea rather than memorization.

### 7. Evidence and reproducibility appendix

Give consequential evidence stable references such as E1 and E2, linked from findings and story sections. Use the appropriate record for each item:

- Source: title, author/publisher, date/version when relevant, accessible link or artifact location, passage or precise locator, and what it supports or leaves open. Indicate when only an excerpt was accessible.
- Experiment: question, rationale, setup and assumptions, exact command/code or procedure, inputs, observed result, interpretation, and limitations. State whether it was executed, attempted but inconclusive, or merely proposed; distinguish synthetic inputs from real-world measurements.

Include a small artifact index for the main scratchpad and branch notes/results. Embed enough essential evidence to review the conclusion without access to another machine's filesystem. Do not dump unrelated logs or sensitive information into the report.

### Review ergonomics and acceptance

Use semantic headings, stable anchors, a linked contents list, readable tables, and diagrams where useful. Reserve tables for comparison or evidence; use prose to teach mechanisms. Collapse bulky reproduction details, never decisive caveats or counterevidence. Status labels must use words, not color alone. Preserve finding/evidence IDs across revisions; mark superseded items rather than silently reusing their IDs.

Before delivery, check that a reader can understand the opening without jargon, explain the central mechanism from the main narrative, trace important conclusions to evidence, distinguish completed work from proposed work, and identify what could change the answer. Check the report for internal contradictions and broken navigation. Say what could not be checked. Do not make a more polished document imply stronger evidence.

Borrow `teach max`'s grounded explanations and HTML presentation when available, but this research brief—not teach's read-only or disposable-notes restrictions—governs the investigation. Keep durable research notes and evidence separate from the disposable presentation. Embed essential evidence in the HTML so remote readers are not stranded by local file links. Use inline styles/diagrams, readable narrow-screen layouts, and no remote scripts or assets.

Return the artifact to this parent Pi conversation and make it viewable in its workspace. Locally, open the HTML with the available cmux/browser path. In remote cmux SSH, serve only a dedicated presentation directory on remote loopback and open its URL using `cmux browser open`; identify that URL as cmux-remote-only, not generally accessible on my machine. If routing is unavailable, give an explicit private transfer/tunnel fallback rather than pretending delivery worked. Never expose the workspace through a public listener. Any presentation server must have a finite timeout; retain its task ID or PID and provide its lifetime and cleanup command. Closing a browser tab does not stop the server. Report the file path, open command/link, and actual delivery status.
