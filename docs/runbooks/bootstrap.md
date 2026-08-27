# Bootstrap Runbook

Status: macOS executed; Ubuntu homelab rollout approved

## Shared Runtime

The repository pins Pi `0.83.0`, which requires Node `>=22.19.0`. Keep live
credentials, package installation state, and sessions host-local; Git carries
the reproducible settings and profile.

## macOS Workstation

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone <repo-url> pi_harness_setup
cd pi_harness_setup
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@0.83.0
brew install tmux neovim
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

The bootstrap may pause for the sudo password when installing tmux. Pi `/login`
is a separate interactive checkpoint; credentials must not enter Git or chat.
See `docs/runbooks/ubuntu-homelab-setup.md` for exact validation, tmux/cmux
operation, and rollback.

## Apply Pi Config

On either host, from the repository root:

```bash
node scripts/apply-pi-setup.mjs
```

The script installs the pinned lean package profile, publishes the seven
versioned skills and the optional `piwt` zsh helper, copies agent/prompt assets,
filters Pi's skill catalog, enables bundled plan mode, and installs the cmux
hook when cmux is available. It preserves unrelated settings/packages and
writes timestamped backups under `~/.config/pi_harness_setup/backups/`.

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
pi --help | rg -- '--plan'
pi list
pi --no-session --thinking minimal --tools read -p 'If a skill named diagnose is listed as available to you, reply exactly SKILL_OK. Otherwise reply exactly SKILL_MISSING.'
```
