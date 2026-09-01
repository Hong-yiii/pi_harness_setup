# Versioned Skills

This directory contains the general skills selected for this harness. The apply
script copies them into `~/.agents/skills` so Pi and compatible agent harnesses
can share them.

Seven skills are pinned from `mattpocock/skills` at commit
`694fa30311e02c2639942308513555e61ee84a6f` because the upstream collection later
renamed or removed several selected skills. Review upstream changes deliberately
before refreshing them.

Local additions:

- `teach`: manual, instruction-only teaching/review mode with simple and
  maximum-context paths that emit disposable temp HTML.
