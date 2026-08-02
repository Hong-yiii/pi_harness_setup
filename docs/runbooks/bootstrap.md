# Bootstrap Runbook

Status: Draft

## Fresh Machine

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone <repo-url> pi_harness_setup
cd pi_harness_setup
```

Install Pi:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
pi --version
```

Install terminal baseline:

```bash
brew install tmux
```

Optional mobile/remote baseline:

```bash
brew install tailscale mosh
```

## Apply Config

Not automated yet. For now, manually compare:

```bash
diff -ru pi/agent ~/.pi/agent
```

The future apply script should:

1. Back up existing `~/.pi/agent`.
2. Copy versioned assets from `pi/agent`.
3. Refuse to overwrite secrets or sessions.
4. Validate Pi startup.

## Extension Layer

Current extension choices are documented in `pi/agent/extensions/README.md`.

Do not install broad packages during bootstrap until the relevant decision doc is accepted.

## Validate

```bash
pi --version
pi --help | rg -- '--plan'
pi --no-session --thinking minimal --tools read -p 'If a skill named diagnose is listed as available to you, reply exactly SKILL_OK. Otherwise reply exactly SKILL_MISSING.'
```
