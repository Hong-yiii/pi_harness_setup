# Mobile Access Runbook

Status: Draft

## Goal

Use the phone to inspect, steer, approve, or resume Pi sessions running on local macOS or the homelab.

## Baseline Architecture

```text
phone terminal
  -> Tailscale/WireGuard private network
  -> SSH or Mosh
  -> tmux session
  -> pi running inside project directory
```

## Minimum Setup

On the host:

```bash
brew install tmux mosh tailscale
```

Start a durable session:

```bash
tmux new -s pi-main
cd ~/Projects/some-project
pi
```

Reconnect:

```bash
tmux attach -t pi-main
```

## Phone Clients To Compare

- Blink Shell: strong Mosh support and keyboard customization.
- Prompt: polished SSH client on iOS.
- Termius: common cross-platform option.
- Moshi: purpose-built iOS terminal for coding-agent workflows.

## Notification Ideas

- ntfy or Pushover for simple push.
- brrr/tap-to-tmux style workflow for "tap notification and reconnect to tmux pane".
- Pi extension hook when a turn ends, errors, or asks for input.

## Decision Needed

- Primary phone client.
- Tailscale versus WireGuard.
- Notification provider.
- Whether to build a Pi RPC web/mobile control surface later.
