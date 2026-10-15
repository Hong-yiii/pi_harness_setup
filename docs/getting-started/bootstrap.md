# Bootstrap Runbook

Status: Shared Mac/Linux baseline; deployment evidence in the shared-sync operation

## Shared Runtime

The shared profile pins Pi `1.2.0`, which requires Node `>=22.19.0`. Keep live
credentials, package installation state, and sessions host-local; Git carries
the reproducible settings and profile.

## macOS Workstation

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone <repo-url> pi_harness_setup
cd pi_harness_setup
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@1.2.0
brew install tmux neovim hunk
node scripts/apply-pi-setup.mjs
```

Optional mobile/remote baseline:

```bash
brew install tailscale mosh
```

Mac cockpit (required for the primary homelab flow):

```bash
brew tap manaflow-ai/cmux
brew install --cask cmux
ln -sf /Applications/cmux.app/Contents/Resources/bin/cmux /opt/homebrew/bin/cmux
cmux hooks pi install --yes
```

## Ubuntu Homelab

The approved homelab checkout lives at `~/pi_harness_setup`. The Ubuntu
bootstrap installs tmux plus checksum-pinned, user-scoped Node and Pi without
replacing the distro Node runtime:

```bash
git clone https://github.com/Hong-yiii/pi_harness_setup.git ~/pi_harness_setup
cd ~/pi_harness_setup
bash scripts/bootstrap-ubuntu-homelab.sh
export PATH="$HOME/.local/bin:$PATH"
node scripts/apply-pi-setup.mjs
```

The bootstrap may pause for the sudo password when installing tmux. It also
installs pinned Hunk beside the user-scoped Node and Pi runtime. Pi `/login` is
a separate interactive checkpoint; credentials must not enter Git or chat.
See `docs/operations/ubuntu-homelab-setup.md` for exact validation, tmux/cmux
operation, and rollback.

Hunk needs no account or initial config. Start with `hunk diff`; see
`docs/guides/hunk.md` for daily use and agent-assisted review.

## Apply Pi Config

On either host, from the repository root:

```bash
node scripts/apply-pi-setup.mjs
```

The script checks the common runtime pin, installs only missing package pins,
publishes eight repo skills plus the enabled bundled BTW skill, global guidance,
agents/prompts, subagent defaults/capacity and Open TUI enablement. It enforces
neon-sakura with one UI owner, preserves unrelated settings/packages/files, and
writes private timestamped backups. Host-peer compatibility and bundled plan
mode are checked separately from package versions. cmux hooks remain an explicit
OS-specific operation, not an apply side effect.

For existing installations, use [Shared harness sync](../operations/shared-harness-sync.md).
Start with `node scripts/apply-pi-setup.mjs --check`; a Git pull or `/reload`
alone does not deploy changes. Never rerun a full bootstrap just to refresh
assets or copy credentials/session state between machines.

Enable the native-worktree helper in zsh:

```zsh
source ~/.config/pi_harness_setup/piwt.zsh
```

Add that line to `~/.zshrc` after trying it interactively.

## Extension Layer

Current extension choices are documented in `pi/agent/extensions/README.md`.

Do not add packages during normal project work. Accumulate the idea in the
current plan review and change the harness as a reviewed batch.

## Validate

```bash
pi --version
hunk --version
hunk skill path
pi --help | rg -- '--plan'
pi list
pi --no-session --thinking minimal --tools read -p 'If a skill named diagnose is listed as available to you, reply exactly SKILL_OK. Otherwise reply exactly SKILL_MISSING.'
```
