# Ubuntu Homelab Setup

Status: Executed through authenticated Pi + tmux on 2026-08-27
Last updated: 2026-08-27

## Goal

Run the same lean Pi harness on the Ubuntu homelab inside durable tmux sessions:

```text
Mac or phone
  -> Tailscale
  -> SSH
  -> tmux on Ubuntu
  -> Pi inside a project checkout
```

cmux is the optional Mac cockpit. tmux is the remote session truth.

## Target And Boundaries

Target checkout:

```text
~/pi_harness_setup
```

Versioned and shared through Git:

- Pi settings, agents, prompts, and selected skills;
- the lean package profile;
- tmux defaults;
- bootstrap and validation instructions.

Host-local and never copied into Git:

- `~/.pi/agent/auth.json` and API keys;
- `~/.pi/agent/sessions/`;
- machine-generated package state under `~/.pi/agent/npm/`;
- cmux relay files under `~/.cmux/`;
- private SSH or Tailscale state.

The bootstrap does not alter Tailscale, SSH, firewall, or system Node. It installs only tmux through apt, then installs a checksum-pinned Node runtime and Pi under the user's home directory.

## Observed Baseline

Read-only inspection on 2026-08-26 found:

- Ubuntu 24.04, Linux x86_64;
- working plain SSH through the `homelab` alias and Tailscale;
- Git 2.43.0 and Tailscale 1.96.4;
- Node 18.19.1 and npm 9.2.0;
- Pi, tmux, and Mosh absent;
- no passwordless sudo;
- Tailscale using a Singapore DERP relay rather than a direct peer path.

The repository-pinned Pi `0.83.0` requires Node `>=22.19.0`. The bootstrap installs Node `24.20.0` LTS for this user without replacing `/usr/bin/node`.

## Observed Rollout

Executed on 2026-08-27:

- cloned `origin/main` commit `b8e30fe` to `~/pi_harness_setup`;
- installed tmux 3.4 through apt;
- verified and installed Node v24.20.0 with npm 11.19.0 at user scope;
- installed Pi 0.83.0 and all six lean-profile packages;
- `npm audit --omit dev` reported zero vulnerabilities;
- ast-grep 0.45.2 and `pi-lens build-graph` worked on Linux;
- authenticated provider state remained host-local with mode `0600`;
- the authenticated smoke prompt returned exactly `homelab-pi-ok`;
- Pi was observed running as a live pane command inside the attached `pi-auth`
  tmux session with cwd `~/pi_harness_setup`;
- the remote Git checkout remained clean;
- the apply backup is
  `~/.config/pi_harness_setup/backups/2026-08-27T03-53-01-112Z`.

The npm installer reported an unapproved postinstall for
`@ast-grep/cli@0.45.2`; no lifecycle script was approved. The shipped Linux
binary worked, so this remains documented rather than bypassed.

Still optional/untested: cmux relay upload, cmux notification passthrough,
remote-tmux beta, Mosh, phone access, and a deliberate detach/reconnect drill.
The Tailscale path still uses DERP rather than a direct peer connection.

## 1. Publish Before Pulling

Only clone a reviewed commit from `origin/main`. From the Mac control checkout:

```bash
git status --short
git log -1 --oneline origin/main
git ls-remote origin refs/heads/main
```

Do not use a dirty local directory as the source of the remote setup.

## 2. Clone At Home Top Level

From the Mac:

```bash
ssh homelab
```

On the homelab:

```bash
test ! -e ~/pi_harness_setup
git clone https://github.com/Hong-yiii/pi_harness_setup.git ~/pi_harness_setup
cd ~/pi_harness_setup
git status --short --branch
```

Stop instead of overwriting if the target path already exists unexpectedly.

## 3. Bootstrap Ubuntu

Run from an interactive SSH terminal because apt may require the sudo password:

```bash
cd ~/pi_harness_setup
bash scripts/bootstrap-ubuntu-homelab.sh
```

If automation reports that tmux is missing but cannot prompt, run only this in your own SSH terminal:

```bash
sudo apt-get update
sudo apt-get install -y tmux
```

Then rerun the bootstrap. It will:

1. verify Ubuntu/Debian Linux x86_64;
2. install tmux if needed;
3. verify the official checksum for the pinned Node tarball;
4. install Node under `~/.local/opt/`;
5. expose Node, npm, and Pi through `~/.local/bin/`;
6. install Pi `0.83.0` with npm lifecycle scripts disabled;
7. back up and install `terminal/tmux/tmux.conf` as `~/.tmux.conf`.

For the current shell and remote one-shot commands:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Ubuntu login shells normally include `~/.local/bin` once it exists. Verify in a fresh SSH login before depending on that behavior.

## 4. Apply The Lean Pi Profile

On the homelab:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/pi_harness_setup
node scripts/apply-pi-setup.mjs
```

Expected Linux-specific behavior:

```text
cmux hook skipped: cmux is not installed or not available.
```

That is intentional: cmux runs on the Mac, not on Ubuntu. Record the timestamped backup path printed by the apply script.

## 5. Authenticate Without Sharing Secrets

Open an interactive terminal owned by the user from the Mac:

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

1. run `/login`;
2. choose the subscription or API-key provider;
3. open the displayed URL in the Mac browser;
4. follow Pi's headless prompt;
5. if the browser cannot reach a loopback callback on the homelab, paste the final redirect URL or authorization code into Pi;
6. confirm the intended model appears, then exit Pi.

Do not paste credentials or the contents of `~/.pi/agent/auth.json` into chat. Validation may check only that the file exists and has restrictive permissions.

## 6. Validate The Harness

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/pi_harness_setup
node --version
npm --version
pi --version
tmux -V
pi list --approve
npm audit --prefix ~/.pi/agent/npm --omit dev
~/.pi/agent/npm/node_modules/.bin/ast-grep --version
~/.pi/agent/npm/node_modules/.bin/pi-lens build-graph --cwd "$PWD"
pi --approve --no-session --thinking minimal -p 'Reply with exactly: homelab-pi-ok'
```

Expected runtime pins:

```text
Node v24.20.0
Pi 0.83.0
```

Do not waive an npm audit finding silently. Record and review it before proceeding.

## 7. Test tmux Durability

Connect from the Mac:

```bash
ssh -t homelab
```

On the homelab, start the durable session:

```bash
export PATH="$HOME/.local/bin:$PATH"
tmux new-session -A -s pi-main
```

After tmux attaches, run inside that session:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/pi_harness_setup
pi --name "homelab main"
```

Detach without stopping Pi:

```text
Ctrl+b, then d
```

Disconnect SSH, reconnect, and attach:

```bash
ssh -t homelab 'tmux attach-session -t pi-main'
```

Confirm the same Pi process and conversation remain. Pi session files are stored on the homelab under `~/.pi/agent/sessions/`; use `/session`, `pi -c`, or `pi -r` there.

## 8. Use cmux From The Mac

First prove plain SSH and tmux. Then, after approving cmux's remote relay write, run from a terminal inside cmux:

```bash
cmux ssh homelab --name "homelab Pi" --command 'export PATH="$HOME/.local/bin:$PATH"; exec tmux new-session -A -s pi-main'
```

On first use, cmux may upload a versioned helper under:

```text
~/.cmux/bin/cmuxd-remote/<version>/<os>-<arch>/cmuxd-remote
```

The helper supports reconnect, remote browser routing, uploads, notifications, and remote CLI relay.

Optional tmux notification passthrough:

```bash
printf '\ePtmux;\e\e]777;notify;Pi;homelab tmux notification works\a\e\\'
```

Remote-tmux mirroring remains optional beta functionality. Test it only after the plain flow is stable:

```bash
cmux ssh-tmux homelab
```

Ubuntu 24.04's tmux 3.4 satisfies cmux's tmux 3.2+ requirement.

## Daily Operation

Start or attach from a normal terminal:

```bash
ssh -t homelab 'export PATH="$HOME/.local/bin:$PATH"; exec tmux new-session -A -s pi-main'
```

Or use the cmux command above. Inside tmux, enter the real project checkout before starting Pi so the process cwd, Pi tools, and subagents agree.

Use a separate named tmux session for each durable project or worktree:

```bash
tmux new-session -A -s project-name
```

## Update

Update only through reviewed repository changes:

```bash
cd ~/pi_harness_setup
git status --short
git pull --ff-only
bash scripts/bootstrap-ubuntu-homelab.sh
node scripts/apply-pi-setup.mjs
```

The bootstrap is idempotent for the pinned Node/Pi versions and preserves a differing tmux config before replacement.

## Rollback

Stop only rollout-created test sessions:

```bash
tmux list-sessions
tmux kill-session -t pi-auth
tmux kill-session -t pi-smoke
```

Restore Pi files from the backup printed by `apply-pi-setup.mjs` under:

```text
~/.config/pi_harness_setup/backups/<timestamp>/
```

Restore tmux if a backup exists, preserving a prior symlink if there was one:

```bash
rm -f ~/.tmux.conf
cp -a ~/.config/pi_harness_setup/backups/<timestamp>/tmux.conf ~/.tmux.conf
```

Remove the user-scoped runtime only if abandoning it. Remove managed links
only when they still point into the harness-owned Node directory:

```bash
node_root="$HOME/.local/opt/node-v24.20.0-linux-x64"
for name in node npm npx corepack pi; do
  link="$HOME/.local/bin/$name"
  case "$(readlink "$link" 2>/dev/null || true)" in
    "$node_root"/bin/*) rm -f "$link" ;;
  esac
done
if [ "$(cat "$node_root/.pi-harness-node-archive.sha256" 2>/dev/null || true)" = \
  "2f2c0da162318f0de47665410c7c8c2ed3d36c8f3105de4bbc61176c70a7cbf2" ]; then
  rm -rf "$node_root"
fi
```

If cmux SSH was tested and its relay should be removed, inspect the versioned path first and remove only that cmux-owned directory after confirmation.

Do not remove Tailscale, SSH configuration, credentials, unrelated npm packages, or the checkout as part of routine rollback.
