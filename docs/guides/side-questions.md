# Side Questions with BTW

Status: Local trial installed on 2026-10-15 (local date; backup timestamp is UTC).
Package: [`pi-btw@0.8.0`](https://github.com/dbachelder/pi-btw), by dbachelder.
Host checked: Pi 1.2.0 on macOS. Provider calls and interactive behavior with
Open TUI remain **Untested**.

## Recommended use

After installation, run `/reload` in Pi, then ask a read-only side question:

```text
/btw:ask why did you choose that approach?
```

This inherits main-session context without putting the side exchange into the
main model's conversation. The side agent gets only `read`, `grep`, `find`, and
`ls`; it cannot normally execute shell commands or edit files. It loads no
child extension tools, even if BTW's extension configuration lists them.

**Plain `/btw`, `/side`, `/btw:new`, and `/btw:tangent` are not read-only.**
They can use `read`, `bash`, `edit`, and `write`. Do not use them as a second
writer while the main agent works in the same directory. This setup recommends
`/btw:ask`; it does not remap or disable the upstream writable commands.
Switching between read-only, contextual, and tangent modes clears the old side
thread and recreates its child, so finish any desired handoff first.

| Action | Command or key |
| --- | --- |
| Ask or follow up read-only | `/btw:ask <question>` |
| Switch focus between side overlay and main editor | `Alt+/` (fallback `Ctrl+Alt+W`) |
| Stop a streaming answer; then dismiss | `Esc`, then `Esc` |
| Clear the side thread | `/btw:clear` |
| Send the entire side conversation to main | `/btw:inject` |
| Summarize and send it to main | `/btw:summarize` |
| Inspect the inherited/overridden side model | `/btw:model` |

Handoff commands **send** material to main, queuing a follow-up if it is busy;
they do not merely prepare an editable draft. Side history persists as hidden
entries in Pi's session file and can survive restart/reload. Hidden means
excluded from the main model's context, not unsaved or secret. Side requests
still consume model quota and send inherited context to the selected provider.

No separate model, provider, SSH workspace, or child extensions were configured.
The side model/thinking level inherit from main unless explicitly overridden.
Pi Subagents still owns delegated agent work; Open TUI owns the persistent UI.

## Install or reconstruct locally

Requires Pi >=0.85.1 and <2. Do not apply to the repository's older shared
Pi 0.83 profile or assume the homelab has a compatible runtime.

Back up `~/.pi/agent/settings.json` and the npm manifests under
`~/.pi/agent/npm/`, then install only this pinned package:

```bash
pi install npm:pi-btw@0.8.0
```

Replace its new string entry in the existing settings `packages` array with:

```json
{
  "source": "npm:pi-btw@0.8.0",
  "skills": []
}
```

Preserve all other settings/package entries. The optional bundled skill is
unnecessary for slash commands and is hidden to keep the ambient skill catalog
small. The extension registered no model-callable tools in the loader check;
its commands and event hooks still run inside the Pi process.

Reload only after active background jobs are finished: the pinned background-task
manager cleans up running jobs on reload. Then test `/btw:ask` while main is busy,
a follow-up, focus switching, cancel/dismiss, and explicit handoff. Confirm the
palette and Open TUI remain intact. These interactive checks are still pending.

## Observed validation and limits

- Installed exactly 0.8.0; its npm manifest has no runtime dependencies or
  install lifecycle scripts.
- Exact settings comparison passed: only the pinned, skill-filtered package
  entry was added; existing UI/theme preferences were preserved.
- All ten pre-existing direct package versions and all pre-existing lockfile
  package versions stayed unchanged. Only `node_modules/pi-btw` was added.
- Pi 1.2's actual extension loader loaded the installed entry in an isolated
  temporary agent directory with no load errors, ten commands registered, and
  zero ambient model tools. No credentials, private sessions, or provider calls
  were used. This proves registration, not full interactive compatibility.
- Source inspection confirmed the read-only tool allowlist and exclusion of
  child extensions in `/btw:ask`; a live side-agent execution was not tested.
- npm audit exited 1 for existing `brace-expansion@5.0.9` (high) and
  `js-yaml@5.2.3` (moderate) findings. Both versions were already in the backup
  lockfile; BTW added neither. No automatic audit fix was run.
- npm also warned about the existing `@ast-grep/cli@0.45.0` install script
  awaiting approval. No new script approval was granted.

Settings/npm-manifest backup:
`~/.config/pi_harness_setup/backups/20261014T192352Z-btw-install/`.

## Rollback

After side work is finished:

```bash
pi remove npm:pi-btw@0.8.0
```

Reload Pi when background jobs are idle. Do not restore the whole settings file
on top of newer unrelated changes. Existing side-thread entries remain part of
session history; uninstalling is not a session-data deletion procedure.

## Why this package

It offers persistent threads, explicit read-only mode, and declared Pi 1.x
support. Its [CI](https://github.com/dbachelder/pi-btw/blob/v0.8.0/.github/workflows/ci.yml)
includes locked, minimum, and latest Pi lanes, with a weekly schedule. Upstream
checks do not replace testing this harness's Open TUI/provider combination.
Only one BTW/side-chat extension is selected to avoid command and shortcut
collisions. The simpler `@narumitw/pi-btw` remains an alternative, not a second
installed owner.
