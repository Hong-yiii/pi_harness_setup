# Homelab Linux Rollout Plan

Date: 2026-08-26
Status: Executed through authenticated Pi + tmux on 2026-08-27; optional cmux checks pending
Target branch: `homelab-linux-rollout`
Target host: SSH alias `homelab`

## Goal

Make this repository the source of truth for the same lean Pi harness on:

- the existing macOS workstation, and
- the Ubuntu homelab, where Pi runs inside durable tmux sessions reached over Tailscale and SSH.

cmux remains the Mac cockpit. tmux remains the remote session truth.

## Read-Only Baseline

Observed on 2026-08-26 without changing the remote host:

- `ssh homelab` succeeds over Tailscale.
- Host: `hongyi-server`, Ubuntu 24.04, Linux x86_64.
- Capacity: 12 CPUs, 15 GiB RAM, 267 GiB free on `/`.
- Installed: Tailscale 1.96.4, Git 2.43.0, Node 18.19.1, npm 9.2.0.
- Missing: Pi, tmux, and Mosh.
- No existing harness checkout was found under `~/Projects` or `~/projects`.
- The account does not have passwordless sudo.
- Tailscale connectivity works through the Singapore DERP relay; a direct peer path was not established during the check.

Pi `0.83.0`, the version pinned by this repository, requires Node `>=22.19.0`; the existing Node 18 runtime cannot run it.

## Decisions For This Rollout

1. **One portable Pi profile.** Reuse `pi/package-profiles/lean-default.json`, agents, prompts, skills, and settings on both hosts. Do not create a Linux package profile until an observed host difference requires one.
2. **Host-local runtime and credentials.** Install Node, Pi, packages, sessions, and OAuth state on the homelab. Never commit or copy `~/.pi/agent/auth.json`, API keys, browser data, session logs, or machine-generated npm state.
3. **tmux owns durability.** Pi runs inside named remote tmux sessions. cmux reconnect and remote-tmux mirroring are convenience layers, not the persistence boundary.
4. **cmux stays on macOS.** The Linux host receives no cmux app. A future `cmux ssh` smoke test may upload cmux's versioned relay under `~/.cmux/bin`; that write is deferred until the user approves the tested base setup.
5. **Top-level checkout.** Interpret “pull it at the top level” as cloning to `~/pi_harness_setup`. Change this path before implementation if the user prefers `~/Projects/pi_harness_setup`.
6. **Minimal package scope.** Install tmux now. Leave Mosh and Neovim optional until requested or justified by use. Do not alter the already-working Tailscale configuration.
7. **No unsafe bootstrap pipe.** Install a current Node 24 LTS Linux x64 tarball from `nodejs.org` at user scope, verify its published SHA-256 checksum, and expose it through `~/.local/bin`. Do not use `curl | sh` or replace Ubuntu's system Node package.
8. **Keep the repository's Pi pin.** Install `@earendil-works/pi-coding-agent@0.83.0` for this rollout. Reconcile the workstation's observed `0.84.2` drift as a separate reviewed update.
9. **Plan first, then one rollout branch.** This plan is pushed for review. After approval, implementation and observed-result documentation continue on the same branch. `origin/main` is updated only by a non-force fast-forward after checks pass.

## Execution Plan

### Phase 0 — Plan Gate

1. Add this plan and the matching batch entry to `docs/reviews/current-plan-review.md`.
2. Commit and push only those plan documents to `origin/homelab-linux-rollout`.
3. Stop and ask the user to approve or amend:
   - the `~/pi_harness_setup` target path,
   - user-scoped verified Node 24 LTS installation,
   - tmux as the only required new apt package,
   - Pi `0.83.0`, and
   - later cmux relay upload for the cockpit smoke test.

No remote filesystem, package, service, Tailscale, or authentication changes happen before approval.

### Phase 1 — Make The Repository Linux-Aware

After approval:

1. Add `docs/runbooks/ubuntu-homelab-setup.md` containing prerequisites, clone/bootstrap/apply commands, interactive checkpoints, validation, daily operation, upgrades, and rollback.
2. Split `docs/runbooks/bootstrap.md` into shared, macOS, and Ubuntu paths.
3. Update `README.md`, `CONTEXT.md`, the workflow manual, and cmux/mobile runbooks so the homelab path is discoverable and no longer marked wholly pending.
4. Add an ADR recording the Linux runtime boundary: shared versioned harness, host-local credentials/sessions, tmux durability, and cmux as a Mac-only control surface.
5. Add one narrow Ubuntu bootstrap script that:
   - exits unless it sees supported Ubuntu/Debian x86_64,
   - checks required commands and available versions,
   - installs only tmux through apt after an interactive sudo checkpoint,
   - downloads a pinned Node 24 LTS tarball from `nodejs.org`,
   - verifies the official SHA-256 checksum before extraction,
   - installs Node at user scope without replacing `/usr/bin/node`,
   - installs the pinned Pi CLI with `--ignore-scripts`,
   - backs up and installs the repository tmux template, and
   - leaves OAuth and `node scripts/apply-pi-setup.mjs` as explicit visible steps.
6. Add `set -g extended-keys on` to the portable tmux template. Do not require tmux 3.5's `csi-u` format because Ubuntu 24.04 ships tmux 3.4; Pi supports tmux's xterm extended-key format.
7. Keep `scripts/apply-pi-setup.mjs` unchanged unless an actual Linux dry run exposes a portability failure. Its missing-cmux path is already non-fatal.

Planned validation before pushing implementation:

```bash
bash -n scripts/bootstrap-ubuntu-homelab.sh
node --check scripts/apply-pi-setup.mjs
node -e 'JSON.parse(require("fs").readFileSync("pi/package-profiles/lean-default.json"))'
git diff --check
```

A fresh read-only reviewer checks the diff, install scope, rollback, and secret boundaries.

### Phase 2 — Publish The Reviewed Implementation

1. Commit the repository implementation and documentation on `homelab-linux-rollout`.
2. Push the branch.
3. Fast-forward `origin/main` without force only after local checks and review pass.
4. Confirm the expected main commit with `git ls-remote origin refs/heads/main` before touching the homelab checkout.

### Phase 3 — Bootstrap The Homelab

1. Reconfirm host identity and current versions over plain SSH.
2. Clone `origin/main` into `~/pi_harness_setup`; stop rather than overwrite if that path unexpectedly exists.
3. Run the repository bootstrap from an interactive SSH terminal.
4. Pause for the user to enter the sudo password for the apt install. Because passwordless sudo is unavailable, the user may run the printed apt command in another terminal and tell the orchestrator when it completes.
5. Verify the Node checksum, user-scoped Node/npm paths, tmux version, and Pi version before applying the profile.
6. Run `node scripts/apply-pi-setup.mjs` from the remote checkout.
7. Record the generated backup directory. Do not inspect or copy credentials.

Remote pre-auth checks:

```bash
node --version
npm --version
pi --version
tmux -V
pi list --approve
npm audit --prefix ~/.pi/agent/npm --omit dev
~/.pi/agent/npm/node_modules/.bin/ast-grep --version
~/.pi/agent/npm/node_modules/.bin/pi-lens build-graph --cwd "$PWD"
```

Stop immediately on checksum failure, unexpected sudo/package scope, npm audit findings requiring a policy decision, or a dirty/unexpected remote checkout.

### Phase 4 — User OAuth Checkpoint

The orchestrator stops and asks the user to connect from their own terminal:

```bash
ssh -t homelab
```

On the homelab, start or attach to the authentication session:

```bash
export PATH="$HOME/.local/bin:$PATH"
tmux new-session -A -s pi-auth
```

After tmux attaches, run inside that session:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/pi_harness_setup
pi
```

Inside Pi:

1. Run `/login`.
2. Select the desired subscription provider.
3. Open the displayed URL in the Mac browser.
4. Follow Pi's headless prompt; if the browser cannot reach the remote loopback callback, paste the final redirect URL or authorization code back into Pi.
5. Exit Pi after the model list is available.

The user must not paste OAuth tokens or `auth.json` contents into chat. Afterward, validation is limited to file existence/permissions and a harmless authenticated prompt; credential contents remain unread.

### Phase 5 — End-To-End Tests

1. **Pi smoke:** run a no-write prompt expecting exactly `homelab-pi-ok`.
2. **tmux config:** launch a disposable tmux server with the repository config and verify it starts cleanly.
3. **Durability:** start `pi-main`, detach/disconnect, reconnect, and confirm the same tmux session and Pi session remain available.
4. **Pi resume:** use `/session` or `pi -c` on the homelab; confirm sessions are remote-host-local.
5. **Plain cmux SSH:** after explicit approval of the relay write, run:

   ```bash
   cmux ssh homelab --name "homelab Pi" --command 'export PATH="$HOME/.local/bin:$PATH"; exec tmux new-session -A -s pi-main'
   ```

6. **Notifications:** test tmux passthrough to the local cmux workspace.
7. **Remote tmux beta:** do not enable by default. Optionally test `cmux ssh-tmux homelab` only after the plain flow is stable; Ubuntu's tmux 3.4 satisfies cmux's 3.2+ requirement.
8. **Network note:** record the DERP path as a performance caveat; do not change Tailscale networking during this rollout.

### Phase 6 — Write Back Observed State

1. Update the Ubuntu runbook and current plan review with exact versions, backup locations, passed/failed checks, OAuth method, and remaining caveats.
2. Mark untested optional paths explicitly: Mosh, phone access, and remote-tmux beta unless actually exercised.
3. Commit and push the observed-result docs.

## Rollback

Repository rollback:

- Revert the rollout commits; never force-push shared history.

Remote rollback, applied only after confirmation:

- Detach or kill only rollout-created test tmux sessions.
- Restore the previous `~/.tmux.conf` from the timestamped backup.
- Restore Pi settings/assets from `~/.config/pi_harness_setup/backups/<timestamp>/`.
- Remove the user-scoped Node directory and `~/.local/bin` links created by the bootstrap.
- Uninstall the global Pi package from that user-scoped Node prefix if abandoning the runtime.
- Remove `~/.cmux/bin/cmuxd-remote/...` only if the cmux relay was actually installed and the user wants it removed.
- Do not remove Tailscale, Git, SSH configuration, unrelated npm packages, credentials, or the checkout without separate confirmation.

## Required Human Checkpoints

1. **Now:** approve or amend this plan.
2. **sudo:** enter the homelab sudo password or run the exact apt command in another SSH terminal.
3. **OAuth:** complete `/login` interactively without sharing secrets.
4. **cmux relay:** approve the first `cmux ssh` connection writing its versioned relay helper.

## Success Criteria

- `origin/main` contains the Linux runbook, bootstrap path, tmux template, ADR, and observed validation notes.
- `~/pi_harness_setup` tracks `origin/main` on the homelab.
- Supported Node, pinned Pi, tmux, and the lean package profile work on Ubuntu.
- Authentication is host-local and permission-restricted.
- A named Pi session survives SSH disconnect and can be resumed through tmux.
- The Mac can attach through plain cmux SSH after relay approval.
- No credentials or machine-private session data appear in Git.
