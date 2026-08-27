# cmux TUI Remote Thin-Client Research

Date: 2026-08-27
Status: Managed install/reconnect smoke passed; interactive UX and durability gates untested

## Question

Can the Ubuntu homelab own cmux TUI workspaces and Pi processes while the Mac
acts as a thin client, replacing tmux only after the new path proves durable?

## Observed Facts

- cmux TUI is a separate Rust multiplexer from the native macOS cmux app.
- The npm package `cmux@0.11.0` requires Node 18 or newer and publishes pinned
  binaries for macOS and Linux on x64 and Arm64.
- The managed SSH client command is:

  ```bash
  npx --yes cmux@0.11.0 remote ssh homelab --session agents-pilot
  ```

- Managed SSH probes `~/.local/bin/cmux-tui`, can install its exact compatible
  packaged binary, and starts or reuses a remote mux owner plus a replaceable
  SSH sidecar.
- The remote mux owner holds the PTYs and workspaces. Replacing the SSH sidecar
  does not terminate its panes.
- `Ctrl+b d` detaches the TUI. Reconnect retries and replay are built into the
  remote protocol.
- One daemon represents one operating-system user and one cmux instance.
  Multiple attached clients can access every workspace and run commands as that
  user; workspaces are organization, not isolation.
- SSH attachment is noninteractive. It requires an already trusted host key and
  key/agent authentication, uses strict host-key checking, and disables agent
  forwarding, X11 forwarding, and port forwarding.
- TUI config lives at `~/.config/cmux/cmux-tui.json` or under
  `$XDG_CONFIG_HOME`. Native cmux app config remains separate at
  `~/.config/cmux/cmux.json`.
- The optional Machines rail uses the same managed SSH lifecycle, but direct
  `remote ssh` needs no persisted machine catalog and is the smaller first test.
- Official documentation does not ship a systemd unit. A service supervisor is
  an operator choice for reboot recovery.
- Official iOS documentation pairs the beta app with a Mac. Direct iOS
  attachment to a Linux cmux TUI owner is not documented as supported.

## Strong Inferences

- This is cmux TUI's native tmux-like architecture: Linux owns PTYs and the Mac
  TUI is a view. It is closer to the desired remote-runtime model than native
  cmux projecting `tmux -CC`.
- The first pilot should use managed SSH over the existing tailnet. Public
  WebSockets, relays, Iroh, and Cloud add no value until SSH proves insufficient.
- Native macOS workspace/tab/pane projection is not preserved. A TUI running in
  a native cmux terminal is still a nested TUI and must win a real UX comparison
  before becoming primary.
- tmux cannot attach to PTYs owned by cmux TUI. During migration it is a fallback
  for separate sessions, not a state-preserving escape hatch for a live cmux TUI
  session.
- Pinning the npm client is necessary. An unreviewed client upgrade can change
  the remote binary and protocol together.

## Pilot Shape

```text
native cmux terminal on Mac
  -> npm cmux TUI 0.11.0 client
  -> managed SSH over Tailscale
  -> Linux cmux TUI `agents-pilot` owner
  -> disposable Pi process

existing fallback, unchanged:
  native cmux Remote tmux
  -> remote tmux `pi-main`
  -> durable Pi process
```

No systemd unit or persistent Machines configuration is needed for the first
manual reconnect test. Add each only after the direct command proves useful.

## Acceptance Tests

1. Verify local Node/npm and remote noninteractive SSH.
2. Run the pinned managed SSH command and record the installed client/server
   versions and host-local paths without reading tokens or session contents.
3. Start a harmless process in `agents-pilot`, detach, reconnect, and confirm the
   same PID/output remains.
4. Open a second client and document multi-client behavior.
5. Run a disposable Pi prompt/session and repeat detach/reconnect.
6. Close/relaunch the Mac client and compare clipboard, paste, scrollback,
   resize, keybindings, and workspace discovery with Remote tmux.
7. Separately test sidecar stop/replacement, daemon failure, Mac reboot, Linux
   reboot, and pinned upgrade/downgrade.
8. Promote only after the rollback and UX tradeoffs are accepted.

## Trust And Rollback

- Keep all transport on SSH/Tailscale during the pilot.
- Do not copy Pi auth or cmux state between hosts.
- Do not expose remote HTTP/WebSocket listeners.
- Keep `pi-main` untouched.
- Use only disposable work in `agents-pilot` until daemon crash and reboot
  behavior pass.
- Stop the pilot and inspect exact cmux-owned paths before removing them.
- Return to `cmux ssh-tmux homelab` for established work.

## Live Pilot Result

Managed installation, disconnect/reconnect, and concurrent-client visibility
passed. The Linux owner remains running empty and `pi-main` was untouched.
Execution details are kept in the non-authoritative log:
`docs/trials/2026-08-27-cmux-tui-remote-pilot.md`.

## Untested

- Interactive TUI use from inside native macOS cmux.
- Pi detach/reconnect under the cmux TUI owner.
- Sidecar replacement beyond ordinary client disconnect, and daemon failure behavior.
- Linux reboot recovery and a future systemd user service.
- Upgrade/downgrade behavior.
- Machines rail persistence.
- Direct official iOS attachment to the Linux owner.

## Primary Sources

- cmux TUI overview: <https://cmux.com/docs/tui>
- Remote daemon and clients: <https://github.com/manaflow-ai/cmux/blob/main/cmux-tui/docs/remote.md>
- Machines rail: <https://github.com/manaflow-ai/cmux/blob/main/cmux-tui/docs/machines.md>
- TUI configuration: <https://github.com/manaflow-ai/cmux/blob/main/cmux-tui/docs/configuration.md>
- Native cmux iOS companion: <https://cmux.com/docs/ios>
- npm package metadata: <https://www.npmjs.com/package/cmux/v/0.11.0>
- Future multi-device runtime direction: <https://github.com/manaflow-ai/cmux/issues/8000>
- Future BYO VPS backend: <https://github.com/manaflow-ai/cmux/issues/8003>
