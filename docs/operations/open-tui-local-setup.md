# Local Open TUI Setup and Background-Task Review

Date: 2026-10-14
Status: Local settings applied; full interactive acceptance remains **Untested**.

## What changed

On the local macOS Pi 1.2.0 runtime:

- Keep the user-installed `pi-open-tui@0.3.11` enabled as the header, editor,
  footer, and turn-telemetry owner. It is a UI extension, not a color theme.
- Preserve the previous `neon-sakura` colors. An initial switch to `system`
  was reverted at the user's request.
- Load only `themes/neon-sakura.json` from `awesome-pi-themes@1.2.19` and
  disable that package's companion extensions.
- Disable `pi-observability@1.3.2` extensions without uninstalling the package
  or deleting its state. Its footer-off toggle is session-local, not persistent;
  leaving both UI owners active risks competing footers. `/obs` is unavailable
  while disabled; Open TUI provides its own current-session stats.

The reported `codex-slate` “Theme conflicts” warning was schema validation,
not a duplicate-name collision. The installed Pi rejects its custom `link`,
`statusLine*`, and `pythonMode` color keys. `neon-sakura` passes that schema
unchanged. No vendor theme files were patched.

## Reproduce the local selection

This is a manual local override for Pi >=1.0, **not** a change to the older
shared package profile or homelab. Back up `~/.pi/agent/settings.json` first.
Merge the following entries into the existing configuration; do not replace
unrelated settings or the rest of the package list:

```json
{
  "theme": "neon-sakura",
  "packages": [
    {
      "source": "npm:awesome-pi-themes",
      "themes": ["themes/neon-sakura.json"],
      "extensions": []
    },
    {
      "source": "npm:pi-observability@1.3.2",
      "extensions": []
    },
    "npm:pi-open-tui"
  ]
}
```

These are the actual local declarations; the unversioned sources do not pin
future installations. The versions above record what was inspected this session.
Keep `"enabled": true` in `~/.pi/agent/open-tui.json`; other Open TUI preferences
were left unchanged. Restart Pi after changing UI owners. Use `/reload` for a
subsequent palette change, `/settings` → Theme for colors, and `/open-tui` for
layout preferences.

A full `scripts/apply-pi-setup.mjs` run may restore the shared profile's
observability entry. Do not run it merely to apply this local selection.

## Verification and rollback

Observed checks:

- Installed Pi's theme validator accepted `neon-sakura`.
- Exact-delta assertions against backups confirmed that only the selected
  theme and affected package-resource filters changed.
- Open TUI was enabled and its declared extension entry existed.
- The user supplied a screenshot showing the Open TUI footer after the change;
  this is not a full restart, command, and conflict regression check.

Pending interactive check: restart Pi, open `/open-tui`, confirm the intended
palette and a single footer, and confirm no theme-schema warning appears.

Host-local settings backups:

- Before the UI switch: `~/.config/pi_harness_setup/backups/20261014T181733Z-open-tui/settings.json`
- Before restoring colors: `~/.config/pi_harness_setup/backups/20261014T182909Z-restore-neon-sakura/settings.json`

To roll back, merge only the previous theme and affected package entries from
the appropriate backup, then restart Pi. Do not overwrite subsequent unrelated
settings. No credentials, session logs, or live settings are stored in this repo.

## Background-task update: inspected, not installed

The footer's `bg ↑ v2.6.10 /bg-update` belongs to `pi-background-tasks`, not
Open TUI. The local package remains **0.6.0** and the shared pin is unchanged.
No upgrade, replacement, or update-notice suppression was performed.

The initial concern was the newer package's additional delegation, Fusion, and
provider-attribution features. Further research found an explicit process-only
mode: `PI_BG_FEATURES=process pi`. The maintainer confirms disabled capabilities
are absent from registration, rather than merely inactive:
[issue #20 comment](https://github.com/ismailsaleekh/pi-background-tasks/issues/20#issuecomment-5755829585).

Compatibility is unresolved, not proven broken on Pi 1.2.0:

- The published 2.6.10 manifest declares Pi peers only through 0.84.x.
  [Manifest](https://github.com/ismailsaleekh/pi-background-tasks/blob/main/package.json).
- A user reports it works on Pi 1.0.0 but the stale range breaks npm dependency
  resolution. This is a user report, not local validation:
  [open issue #40](https://github.com/ismailsaleekh/pi-background-tasks/issues/40).
- The maintainer describes focused newer-host tests while explicitly leaving
  broad compatibility ranges and scheduled latest-Pi testing unfinished:
  [issue #31 comment](https://github.com/ismailsaleekh/pi-background-tasks/issues/31#issuecomment-5777900720).
- Earlier newer-Pi runtime failures affected the added Anthropic transport;
  the maintainer reports the fix shipped in 2.6.3:
  [PR #28 comment](https://github.com/ismailsaleekh/pi-background-tasks/pull/28#issuecomment-5777900746).

Recommendation, not executed: test 2.6.10 in an isolated process-only setup on
Pi 1.2.0 before considering a live upgrade. Validate launch, logs, completion
wake-up, cancellation, reload/shutdown cleanup, and extension ownership. Do not
force npm peer resolution in the live shared extension tree. Popularity alone
is not evidence of compatibility, and no replacement was selected.
