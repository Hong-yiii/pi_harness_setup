# cmux Setup Runbook

Status: Native cmux SSH adopted; Remote tmux retained as break-glass fallback
Last updated: 2026-10-07

## Goal

Use native cmux as the Mac control surface while Linux owns detachable remote PTYs through native cmux SSH.

The desired feel:

- visual workspaces for parallel agents,
- splits and browser panes without fighting prefix keys,
- notifications when agents need attention,
- mouse support and familiar Mac affordances,
- Vim-style navigation where it helps,
- remote homelab sessions over Tailscale/SSH,
- phone access later through cmux iOS beta or the SSH/Mosh/tmux baseline.

## Current Decision

The normal path is:

```text
native cmux on Mac
  -> SSH/Tailscale
  -> versioned cmuxd-remote on Linux
  -> detachable PTY
  -> project shell and Pi
```

Use `cmux ssh homelab`. Native cmux keeps its workspaces, panes, Feed,
notifications, browser routing, and Mac shortcuts while Linux owns the process.
ADR 0013 records the decision; ADR 0012 Remote tmux is fallback only.

## Sources

- cmux GitHub README: <https://github.com/manaflow-ai/cmux>
- cmux configuration docs: <https://cmux.com/docs/configuration>
- cmux keyboard shortcuts: <https://cmux.com/docs/keyboard-shortcuts>
- cmux SSH docs: <https://cmux.com/docs/ssh>
- cmux remote tmux beta docs: <https://cmux.com/docs/remote-tmux>
- cmux iOS beta docs: <https://cmux.com/docs/ios>
- cmux notification docs: <https://cmux.com/docs/notifications>

## Install Or Repair

Official install options:

```bash
brew tap manaflow-ai/cmux
brew install --cask cmux
```

Update:

```bash
brew upgrade --cask cmux
```

If Homebrew has a broken partial cask state, remove the stale cask entry and reinstall:

```bash
brew uninstall --cask cmux
brew install --cask cmux
```

Then verify the CLI is on PATH:

```bash
command -v cmux
cmux --help
```

cmux's CLI works automatically inside cmux terminals. To use it from normal shells outside cmux, create the documented symlink after the app is installed:

```bash
sudo ln -sf "/Applications/cmux.app/Contents/Resources/bin/cmux" /usr/local/bin/cmux
```

Requirements from current docs:

- macOS 14 or later,
- Apple Silicon or Intel Mac.

Observed local state after setup:

- cmux app already existed at `/Applications/cmux.app`.
- cmux CLI linked at `/opt/homebrew/bin/cmux`.
- cmux version: `0.64.20 (100) [14e3400b9]`.
- tmux installed: `3.7b`.
- mosh installed: `1.4.0`.
- Neovim installed: `0.12.4`.

### Latest Local Version Check — 2026-10-07

- Installed cmux: `0.65.0 (108) [dda24fbd2]`, reported by `cmux --version`.
- App bundle version/build also report `0.65.0` / `108`.
- Live `~/.config/cmux/cmux.json` and `~/.config/ghostty/config` match the
  repository templates byte-for-byte.
- `cmux config check` passed JSONC syntax and semantic validation.
- Adjacent configuration drift: local `~/.tmux.conf` lacks
  `set -g extended-keys on`, which is already in `terminal/tmux/tmux.conf`.
  This check did not change live configuration.
- Native SSH reconnect, remote helper compatibility, and Pi hook behavior on
  `0.65.0` remain `Untested`; the earlier `0.64.22` results below are historical
  evidence, not validation of this release.

Homebrew warning: local Homebrew has several untrusted taps. We did not broad-trust any taps. The installed packages came from Homebrew core. Treat tap cleanup/trust as a separate safety task.

## Config Locations

cmux reads terminal rendering from Ghostty config:

```text
~/.config/ghostty/config
~/Library/Application Support/com.mitchellh.ghostty/config
```

cmux app settings live here:

```text
~/.config/cmux/cmux.json
```

Project-local commands/actions can live here:

```text
.cmux/cmux.json
```

Reload after editing:

```bash
cmux reload-config
```

or press `Cmd+Shift+,`.

This machine already has `~/.config/cmux/cmux.json`; it is mostly cmux's generated commented template. Back it up before applying repo defaults.

Local backups from this run:

```text
~/.config/pi_harness_setup/backups/20260803-011740/cmux.json
~/.config/pi_harness_setup/backups/20260803-011740/codex.config.toml
```

No previous `~/.tmux.conf` or `~/.config/ghostty/config` existed to back up.

Applied live config:

```text
terminal/cmux/cmux.jsonc -> ~/.config/cmux/cmux.json
terminal/ghostty/config -> ~/.config/ghostty/config
terminal/tmux/tmux.conf -> ~/.tmux.conf
```

## Recommended First Defaults

Keep these as templates first. Do not overwrite an existing live config without a backup and merge.

Template files:

- `terminal/cmux/cmux.jsonc`
- `terminal/ghostty/config`
- `terminal/tmux/tmux.conf`

The intent:

- cmux sidebar stays on,
- notifications stay on,
- copy-on-select is enabled for mouse friendliness,
- agent auto-resume is disabled initially to avoid surprise restarts,
- socket control stays in `cmuxOnly` mode rather than `allowAll`,
- embedded browser opens local dev URLs,
- Vim-ish pane navigation uses `Ctrl+b` chords. Other actions retain cmux's
  native Mac defaults (`Cmd+T` for a new surface, `Cmd+D`/`Cmd+Shift+D` for
  splits, and the standard surface/zoom/notification shortcuts),
- tmux mouse mode is enabled for remote/phone comfort.

## Agent Hooks And Restore

Install hooks after `pi`, `codex`, and other agent CLIs are on PATH:

```bash
cmux hooks setup
cmux hooks setup pi
cmux hooks setup codex
```

Current cmux hook behavior:

- Pi hook file: `~/.pi/agent/extensions/cmux-session.ts`
- Pi resume command: `pi --session <id>`
- Codex hook files: `~/.codex/hooks.json` and `~/.codex/config.toml`
- Codex resume command: `codex resume <id>`
- Hook session maps: `~/.cmuxterm/<agent>-hook-sessions.json`

Start with `terminal.autoResumeAgentSessions` disabled. cmux will restore layout and metadata, but agent terminals stay idle until resumed manually. Turn auto-resume on only after it feels predictable.

Remote caveat: native SSH exposes the cmux relay command inside its remote
workspace, and remote notifications passed validation. The profile does not yet
install native Pi lifecycle hooks on Ubuntu, so automatic remote Pi Feed/resume
behavior is not assumed. `cmuxd-remote`, not the local Mac hook, owns transport
persistence.

Executed locally:

```bash
cmux hooks pi install --yes
```

Installed:

```text
~/.pi/agent/extensions/cmux-session.ts
```

Codex hooks were not installed in this batch. We backed up `~/.codex/config.toml` only as a precaution.

## cmux Basics To Learn

| Action | Default |
| --- | --- |
| Command palette | `Cmd+Shift+P` |
| Settings | `Cmd+,` |
| Reload config | `Cmd+Shift+,` |
| Toggle left sidebar | `Cmd+B` |
| New workspace | `Cmd+N` |
| New surface/tab | `Cmd+T` |
| Go to workspace | `Cmd+P` |
| Workspace 1-9 | `Cmd+1` ... `Cmd+9` |
| Split right | `Cmd+D` |
| Split down | `Cmd+Shift+D` |
| Focus pane | `Option+Cmd+Arrow` |
| Toggle pane zoom | `Cmd+Shift+Enter` |
| Open browser | `Cmd+Shift+L` |
| Notification panel | `Cmd+Shift+I` |
| Jump to unread | `Cmd+Shift+U` |

Vim-ish learning target:

| Motion | Meaning |
| --- | --- |
| `h` | left |
| `j` | down |
| `k` | up |
| `l` | right |
| `/` | search |
| `Ctrl+d` | half-page down |
| `Ctrl+u` | half-page up |
| `g` / `G` | top / bottom |

cmux already uses `J/K/H/L` in focused sidebar/file-explorer rows. The runbook template adds tmux-style `Ctrl+b` chords for pane movement so you can learn Vim motions without giving up mouse and Mac shortcuts.

## tmux Defaults For Mouse/QOL

Use tmux as the remote session server, break-glass attachment path, and phone fallback.

Key choices:

- `set -g mouse on` for click, scroll, resize, select.
- `set -g allow-passthrough on` so cmux/OSC notifications can pass through tmux.
- `set -s set-clipboard external` as the safer clipboard default.
- Vi copy mode for navigation practice.
- Large history limit for long agent sessions.
- Easier splits that preserve current working directory.

Use `set-clipboard on` only if you deliberately want programs inside tmux, such as Neovim, to write the local clipboard directly. It is convenient but less strict.

If a remote Linux box complains about `xterm-ghostty`, install Ghostty terminfo on the host or temporarily use `TERM=xterm-256color`.

## Native cmux SSH Homelab Flow

From a terminal inside native cmux:

```bash
cmux ssh homelab
```

Then `cd` to the project and start Pi. The first connection installs the
versioned `cmuxd-remote` helper. Browser panes use the homelab network, remote
notifications reach the native Feed, and transport drops reattach to the same
remote PTY.

Detailed use and implementation: `docs/guides/cmux-ssh-remote.md`.

## Remote tmux Fallback Flow

Bootstrap the Linux host first with
`docs/operations/ubuntu-homelab-setup.md`. The native app remains macOS-only; its
versioned `cmuxd-remote` helper runs on Ubuntu. tmux 3.2+ continues to own
existing fallback sessions.

Keep the normal SSH alias:

```sshconfig
Host homelab
  HostName <tailscale-name-or-ip>
  User <user>
  IdentityFile ~/.ssh/id_ed25519
  ServerAliveInterval 20
  ServerAliveCountMax 2
```

Enable **Settings -> Beta Features -> Remote tmux** in cmux. The toggle is an
app preference, not a supported `cmux.json` key.

Create a remote session when none exists:

```bash
ssh homelab 'export PATH="$HOME/.local/bin:$PATH"; tmux new-session -d -s pi-main -c "$HOME/pi_harness_setup"'
```

From a terminal inside cmux, mirror the host:

```bash
cmux ssh-tmux homelab
```

Mapping is bidirectional:

```text
tmux session -> cmux workspace
tmux window  -> cmux tab
tmux pane    -> native cmux split
```

Closing, splitting, or reordering the cmux mirror changes the real tmux
session. After relaunching cmux, rerun `cmux ssh-tmux homelab`; the remote
session continues running.

Remote tmux uses SSH plus `tmux -CC`. It remains available for recovery, but
native `cmux ssh homelab` is the normal daily path.

Break-glass recovery:

```bash
ssh -t homelab 'tmux attach-session -t pi-main'
```

## Phone Flow

The cmux iOS beta pairs with the Mac and can view its native workspaces, including
native SSH workspaces, while the Mac remains online and reachable over
Tailscale. Notification forwarding can send terminal notification text through
cmux servers and Apple Push; start with hidden notification content.

Keep phone SSH/Mosh/tmux as break-glass fallback.

## Smoke Test

Local:

```bash
cmux notify --title "cmux" --body "notification test"
```

Hook setup:

```bash
cmux hooks setup pi
```

Then start `pi` in cmux, quit cmux normally, reopen, and confirm the workspace appears without auto-starting the agent while `autoResumeAgentSessions` is false.

Native cmux SSH:

```bash
cmux ssh homelab
```

Run a harmless remote process, interrupt the SSH transport, and confirm cmux
reattaches to the same PID and screen. Native notification, browser routing, and
real Pi reconnect validation are recorded in
`docs/history/2026-08-27-native-cmux-ssh-pilot.md`.

Remote tmux fallback:

```bash
ssh homelab 'tmux new-session -d -s pi-smoke -c "$HOME/pi_harness_setup"'
cmux ssh-tmux homelab
```

Inside the mirrored `pi-smoke` workspace:

```bash
export PATH="$HOME/.local/bin:$PATH"
pi --name "remote tmux smoke"
```

From a terminal inside cmux, safely detach the control client:

```bash
cmux rpc remote.tmux.detach '{"host":"homelab","session":"pi-smoke"}'
```

Do not close a mirrored pane or tab for this test: those actions propagate to
the real tmux layout. Verify survival from a normal shell:

```bash
ssh homelab 'tmux has-session -t pi-smoke && echo remote-tmux-survived'
```

Rerun `cmux ssh-tmux homelab`, confirm the same Pi process remains, then clean
up only the disposable smoke session after quitting Pi:

```bash
ssh homelab 'tmux kill-session -t pi-smoke'
```

Observed Remote tmux cutover:

- cmux 0.64.22 and remote tmux 3.4 passed the version preflight.
- Backed up the cmux preference domain under
  `~/.config/pi_harness_setup/backups/20260827T064548Z/` before enabling the
  Remote tmux beta.
- Created remote session `pi-main` with Pi running in
  `~/pi_harness_setup`.
- `cmux ssh-tmux homelab` created a native `pi-main` workspace with one tmux
  window and live Pi pane output.
- `remote.tmux.detach` removed the control client while Pi and the remote tmux
  session stayed alive; a second `cmux ssh-tmux homelab` reattached
  successfully.
- No plain cmux SSH relay appeared under remote `~/.cmux`.
- `cmux ssh-tmux homelab --new-window` returned `method_not_found` in this
  release; use the command without `--new-window`.

Observed local validation:

- `cmux config check`: JSONC syntax valid.
- `tmux -f ~/.tmux.conf new-session -d -s pi-harness-smoke`: succeeded, then session was killed.
- `pi --approve --no-session --thinking minimal -p "Reply with exactly: cmux-pi-hook-ok"` printed `cmux-pi-hook-ok`.
- `cmux reload-config` and `cmux notify` from this non-cmux shell were blocked with "Access denied - only processes started inside cmux can connect". This is expected with the safer `cmuxOnly` socket mode. Run reload/notification smoke tests from inside a cmux terminal, or deliberately change socket policy later after review.

Operational note: Pi print-mode may remain open after printing the expected smoke response with the current extension mix. Stop the smoke process manually if it does not exit.

## Rollback

Exit Pi and close any native SSH workspace being abandoned. Return to the
break-glass fallback with:

```bash
cmux ssh-tmux homelab
```

Disabling **Settings -> Beta Features -> Remote tmux** remains the fallback's
own rollback. Existing tmux sessions are unchanged and remain available through
direct SSH/tmux.

To remove cmux app:

```bash
brew uninstall --cask cmux
```

To stop using the repo templates:

```bash
mv ~/.config/cmux/cmux.json ~/.config/cmux/cmux.json.disabled
mv ~/.config/ghostty/config ~/.config/ghostty/config.disabled
mv ~/.tmux.conf ~/.tmux.conf.disabled
```

Only run those after saving backups if the files contain existing personal config.
