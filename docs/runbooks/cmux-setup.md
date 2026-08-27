# cmux Setup Runbook

Status: Executed locally on macOS; homelab rollout approved, validation pending
Last updated: 2026-08-03

## Goal

Use cmux as the Mac-native control surface for local and remote Pi work while keeping tmux as the durable session substrate.

The desired feel:

- visual workspaces for parallel agents,
- splits and browser panes without fighting prefix keys,
- notifications when agents need attention,
- mouse support and familiar Mac affordances,
- Vim-style navigation where it helps,
- remote homelab sessions over Tailscale/SSH,
- phone access later through cmux iOS beta or the SSH/Mosh/tmux baseline.

## Current Decision

cmux is the cockpit. tmux is the session truth.

Use:

```text
cmux on macOS
  -> local Pi sessions, local browser panes, notifications
  -> cmux ssh homelab for remote workspaces
  -> optional cmux ssh-tmux homelab for mirrored tmux sessions

tmux on homelab
  -> durable Pi sessions that survive disconnects
  -> phone attach fallback through SSH/Mosh
```

Do not treat cmux and tmux as mutually exclusive.

## Sources

- cmux GitHub README: https://github.com/manaflow-ai/cmux
- cmux configuration docs: https://cmux.com/docs/configuration
- cmux keyboard shortcuts: https://cmux.com/docs/keyboard-shortcuts
- cmux SSH docs: https://cmux.com/docs/ssh
- cmux remote tmux beta docs: https://cmux.com/docs/remote-tmux
- cmux iOS beta docs: https://cmux.com/docs/ios
- cmux notification docs: https://cmux.com/docs/notifications

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

Remote caveat: local Pi/Codex hooks are the supported path. Remote homelab hooks are still a weak spot in current cmux: `cmux ssh` gives remote terminals, browser routing, relay, and coarse notifications, but remote lifecycle/feed/native agent restore should be treated as in-progress. For homelab durability today, keep tmux as the session truth.

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
|---|---|
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
|---|---|
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

Use tmux inside remote sessions and as the phone fallback.

Key choices:

- `set -g mouse on` for click, scroll, resize, select.
- `set -g allow-passthrough on` so cmux/OSC notifications can pass through tmux.
- `set -s set-clipboard external` as the safer clipboard default.
- Vi copy mode for navigation practice.
- Large history limit for long agent sessions.
- Easier splits that preserve current working directory.

Use `set-clipboard on` only if you deliberately want programs inside tmux, such as Neovim, to write the local clipboard directly. It is convenient but less strict.

If a remote Linux box complains about `xterm-ghostty`, install Ghostty terminfo on the host or temporarily use `TERM=xterm-256color`.

## Remote Homelab Flow

Bootstrap the Linux host first with
`docs/runbooks/ubuntu-homelab-setup.md`. cmux remains installed only on macOS;
tmux on Ubuntu owns remote durability.

Use a normal SSH alias first:

```sshconfig
Host homelab
  HostName <tailscale-name-or-ip>
  User <user>
  IdentityFile ~/.ssh/id_ed25519
  ServerAliveInterval 20
  ServerAliveCountMax 2
```

Open a cmux remote workspace:

```bash
cmux ssh homelab --name "homelab"
```

Run an initial command:

```bash
cmux ssh homelab --name "pi main" --command 'export PATH="$HOME/.local/bin:$PATH"; exec tmux new-session -A -s pi-main'
```

If the remote tmux beta is enabled in cmux settings and the homelab has tmux 3.2+:

```bash
cmux ssh-tmux homelab
```

Use remote tmux beta only after the plain SSH flow feels stable.

After plain SSH and tmux work, explicitly approve the first cmux connection.
On first remote SSH use, cmux may upload a relay helper to the remote host:

```text
~/.cmux/bin/cmuxd-remote/<version>/<os>-<arch>/cmuxd-remote
```

That helper handles browser proxying, CLI relay, and remote session management.

## Phone Flow

Keep the baseline:

```text
phone -> Tailscale -> SSH/Mosh -> tmux -> Pi
```

cmux iOS is interesting but beta. It pairs to a Mac running cmux and needs your phone to reach the Mac over your own network. Tailscale is the simplest path. Notification forwarding can send terminal notification text through cmux servers and Apple Push unless "Hide content" is enabled, so start with hidden notification content.

Do not depend on cmux iOS as the only phone path yet. Keep SSH/Mosh/tmux working as the fallback.

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

Remote:

```bash
cmux ssh homelab --name "homelab smoke" --command 'export PATH="$HOME/.local/bin:$PATH"; exec tmux new-session -A -s pi-smoke'
```

Inside the remote tmux session:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/pi_harness_setup
pi
```

Optional cmux/tmux passthrough notification:

```bash
printf '\ePtmux;\e\e]777;notify;Pi;tmux passthrough works\a\e\\'
```

Observed local validation:

- `cmux config check`: JSONC syntax valid.
- `tmux -f ~/.tmux.conf new-session -d -s pi-harness-smoke`: succeeded, then session was killed.
- `pi --approve --no-session --thinking minimal -p "Reply with exactly: cmux-pi-hook-ok"` printed `cmux-pi-hook-ok`.
- `cmux reload-config` and `cmux notify` from this non-cmux shell were blocked with "Access denied - only processes started inside cmux can connect". This is expected with the safer `cmuxOnly` socket mode. Run reload/notification smoke tests from inside a cmux terminal, or deliberately change socket policy later after review.

Operational note: Pi print-mode may remain open after printing the expected smoke response with the current extension mix. Stop the smoke process manually if it does not exit.

## Rollback

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
