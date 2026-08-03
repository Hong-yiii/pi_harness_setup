# Bootstrap Runbook

Status: Ready for the Pi layer; homelab validation pending

## Fresh Machine

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone <repo-url> pi_harness_setup
cd pi_harness_setup
```

Install Pi:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@0.83.0
pi --version
```

Install terminal baseline:

```bash
brew install tmux neovim
```

Optional mobile/remote baseline:

```bash
brew install tailscale mosh
```

Optional Mac cockpit:

```bash
brew tap manaflow-ai/cmux
brew install --cask cmux
ln -sf /Applications/cmux.app/Contents/Resources/bin/cmux /opt/homebrew/bin/cmux
cmux hooks pi install --yes
```

## Apply Pi Config

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
