# Native cmux SSH Pilot Log — 2026-08-27

This is an execution log, not an accepted architecture decision.

Compared path:

```text
native macOS cmux
  -> SSH management and attachment
  -> Linux cmuxd-remote detachable PTY daemon
  -> remote process or Pi
```

The test intentionally left the existing tmux `pi-main` fallback and Rust
`cmux-tui` `agents-pilot` owner unchanged.

## Baseline

- native cmux `0.64.22` on macOS;
- working `homelab` SSH alias over Tailscale;
- remote `~/.cmux/` initially absent;
- remote Node `v24.20.0` and npm `11.19.0`;
- remote Pi reported `0.84.3`, which differs from the repository's documented
  `0.83.0` pin and should be reconciled separately;
- PR #4 converted to draft before testing.

## Documented Durability Model

The native SSH documentation states that:

- the remote session persists when the connection drops;
- reconnect uses exponential backoff starting at 3 seconds and capped at 60;
- default SSH keepalives are `ServerAliveInterval=20` and
  `ServerAliveCountMax=2` unless already configured;
- `cmuxd-remote` owns detachable PTY session management across reconnects.

Actual local SSH process arguments confirmed the documented keepalive values.

## 1. Managed Native SSH Startup

Started a disposable workspace:

```bash
cmux ssh homelab \
  --name "native-ssh-pilot" \
  --command 'cd "$HOME/pi_harness_setup" && printf "native-cmux-ssh-ok\n" && exec sleep 1800'
```

Observed:

- native workspace/sidebar entry created;
- remote marker visible through `cmux read-screen`;
- versioned daemon installed at
  `~/.cmux/bin/cmuxd-remote/0.64.22/linux-amd64/cmuxd-remote`;
- persistent server, stdio carrier, and disposable remote process started;
- the remote process PID was recorded for continuity checks.

## 2. Remote Carrier Failure

Terminated only the remote `cmuxd-remote serve --stdio` carrier while leaving
the persistent server and PTY process alive.

Result:

- cmux created a new carrier immediately;
- the same remote PID remained alive;
- the same persisted SSH session reattached;
- the original terminal marker and scrollback remained visible.

Result: passed.

## 3. Local SSH Failure

Terminated the native workspace's local OpenSSH transport process.

Result:

- cmux created a replacement local SSH process;
- the same remote PID remained alive;
- the persisted session reported one active attachment;
- the original terminal marker and scrollback remained visible.

Result: passed.

## 4. Native Notification Relay

Created a disposable native SSH workspace whose remote command called:

```bash
cmux notify \
  --title "Native SSH pilot" \
  --body "remote notification ok"
```

The notification appeared unread in the native cmux notification list with the
correct remote workspace and surface identifiers.

Result: passed.

## 5. Remote Browser Routing

Started a loopback-only HTTP server on the homelab at
`127.0.0.1:18765`, then opened this URL in a native browser split belonging to
the remote workspace:

```text
http://localhost:18765/
```

The native browser loaded the remote directory listing without a manual SSH
`-L` forward. The browser surface remained part of the native workspace tree.

Result: passed.

## 6. Real Pi Session

Started Pi in another native SSH workspace:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/pi_harness_setup
exec pi --name "native-cmux-ssh-pi-pilot"
```

Sent the prompt:

```text
Reply with exactly: native-cmux-ssh-pi-ok
```

Pi returned the expected response. The remote Pi PID was recorded, then the
local SSH transport was terminated.

Result:

- native cmux created a replacement SSH transport;
- Pi retained the same remote PID;
- the same Pi screen and response reappeared;
- the persisted SSH session reattached with one active view.

Result: passed.

## 7. Cleanup

- closed every disposable native SSH workspace;
- confirmed the disposable sleep, HTTP server, and Pi processes exited;
- confirmed no persisted native SSH PTY sessions remained;
- confirmed no `cmuxd-remote` process remained after the last workspace closed;
- confirmed tmux `pi-main` remained present;
- initially left the Rust `agents-pilot` owner running for comparison; after
  native SSH was selected, verified it was empty and removed its binary/state.

## Passed

- native workspace/sidebar creation;
- documented keepalive configuration;
- versioned remote-daemon bootstrap;
- remote carrier replacement;
- local SSH transport replacement;
- same-process PTY continuity;
- terminal output and scrollback continuity;
- native remote notifications;
- native browser proxying through the homelab network;
- real Pi prompt and same-PID reconnect;
- clean teardown without disturbing either fallback.

## Untested

- complete native cmux app quit and relaunch while preserving a remote PTY;
- Mac sleep/wake rather than an explicit transport kill;
- Mosh transport;
- remote host reboot;
- phone attachment through the beta iOS companion.

## Result

Native `cmux ssh` passed the core thin-client and agent workflow tests while
retaining the native sidebar, notification Feed, and browser integration. ADR
0013 adopts it as the single normal Mac-to-homelab path. The Rust cmux TUI pilot
was removed; Remote tmux remains break-glass recovery.
