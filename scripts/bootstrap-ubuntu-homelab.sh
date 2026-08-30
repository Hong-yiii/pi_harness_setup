#!/usr/bin/env bash
set -euo pipefail

readonly NODE_VERSION="24.20.0"
readonly NODE_SHA256="2f2c0da162318f0de47665410c7c8c2ed3d36c8f3105de4bbc61176c70a7cbf2"
readonly PI_VERSION="0.83.0"
readonly HUNK_VERSION="0.20.0"
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
readonly NODE_ARCHIVE="node-v${NODE_VERSION}-linux-x64.tar.xz"
readonly NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ARCHIVE}"
readonly SHASUMS_URL="https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"
readonly NODE_ROOT="$HOME/.local/opt/node-v${NODE_VERSION}-linux-x64"
readonly NODE_MARKER="$NODE_ROOT/.pi-harness-node-archive.sha256"
readonly LOCAL_BIN="$HOME/.local/bin"
readonly TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
readonly BACKUP_DIR="$HOME/.config/pi_harness_setup/backups/$TIMESTAMP"

die() {
	printf 'error: %s\n' "$*" >&2
	exit 1
}

require_command() {
	command -v "$1" >/dev/null 2>&1 || die "required command is missing: $1"
}

install_managed_link() {
	local source="$1"
	local destination="$2"

	if [[ -L $destination ]]; then
		[[ $(readlink "$destination") == "$source" ]] ||
			die "refusing to replace existing symlink: $destination"
		return
	fi
	[[ ! -e $destination ]] || die "refusing to replace existing path: $destination"
	ln -s "$source" "$destination"
}

[[ $EUID -ne 0 ]] || die "run this as the homelab user, not root"
[[ $(uname -s) == "Linux" ]] || die "this bootstrap supports Linux only"
[[ $(uname -m) == "x86_64" ]] || die "this bootstrap currently supports x86_64 only"
[[ -r /etc/os-release ]] || die "cannot identify Linux distribution"

# shellcheck source=/dev/null
source /etc/os-release
case "${ID:-}" in
ubuntu | debian) ;;
*) die "supported distributions are Ubuntu and Debian; found ${ID:-unknown}" ;;
esac

for command in curl git install ln mktemp mv readlink sha256sum tar xz; do
	require_command "$command"
done

if ! command -v tmux >/dev/null 2>&1; then
	if [[ ! -t 0 || ! -t 1 ]]; then
		cat >&2 <<'EOF'
tmux is missing and sudo needs an interactive terminal.
Run this in your own SSH terminal, then rerun the bootstrap:

  sudo apt-get update
  sudo apt-get install -y tmux
EOF
		exit 20
	fi
	require_command sudo
	sudo apt-get update
	sudo apt-get install -y tmux
fi

tmux_version="$(tmux -V | awk '{ print $2 }')"
[[ $tmux_version =~ ^([0-9]+)\.([0-9]+) ]] || die "cannot parse tmux version: $tmux_version"
if ((BASH_REMATCH[1] < 3 || (BASH_REMATCH[1] == 3 && BASH_REMATCH[2] < 2))); then
	die "tmux 3.2 or newer is required; found $tmux_version"
fi

mkdir -p "$HOME/.local/opt" "$LOCAL_BIN"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

curl --fail --silent --show-error --location "$SHASUMS_URL" --output "$tmp_dir/SHASUMS256.txt"
published_sha="$(awk -v archive="$NODE_ARCHIVE" '$2 == archive { print $1 }' "$tmp_dir/SHASUMS256.txt")"
[[ -n $published_sha ]] || die "Node release does not publish a checksum for $NODE_ARCHIVE"
[[ $published_sha == "$NODE_SHA256" ]] || die "published Node checksum differs from the reviewed repository pin"

if [[ -x "$NODE_ROOT/bin/node" ]]; then
	[[ $("$NODE_ROOT/bin/node" --version) == "v$NODE_VERSION" ]] || die "unexpected Node installation at $NODE_ROOT"
	[[ -f $NODE_MARKER ]] || die "existing Node tree lacks the harness checksum marker: $NODE_ROOT"
	[[ $(<"$NODE_MARKER") == "$NODE_SHA256" ]] || die "existing Node tree has an unexpected checksum marker"
else
	[[ ! -e $NODE_ROOT ]] || die "refusing to overwrite unexpected path: $NODE_ROOT"
	curl --fail --silent --show-error --location "$NODE_URL" --output "$tmp_dir/$NODE_ARCHIVE"
	(
		cd "$tmp_dir"
		printf '%s  %s\n' "$NODE_SHA256" "$NODE_ARCHIVE" | sha256sum --check --strict
	)
	tar -xJf "$tmp_dir/$NODE_ARCHIVE" -C "$tmp_dir"
	printf '%s\n' "$NODE_SHA256" >"$tmp_dir/node-v${NODE_VERSION}-linux-x64/.pi-harness-node-archive.sha256"
	mv "$tmp_dir/node-v${NODE_VERSION}-linux-x64" "$NODE_ROOT"
fi

for command in node npm npx corepack; do
	install_managed_link "$NODE_ROOT/bin/$command" "$LOCAL_BIN/$command"
done
export PATH="$LOCAL_BIN:$PATH"

"$LOCAL_BIN/npm" install --global --ignore-scripts "@earendil-works/pi-coding-agent@$PI_VERSION"
"$LOCAL_BIN/npm" install --global --ignore-scripts "hunkdiff@$HUNK_VERSION"
install_managed_link "$NODE_ROOT/bin/pi" "$LOCAL_BIN/pi"
install_managed_link "$NODE_ROOT/bin/hunk" "$LOCAL_BIN/hunk"
install_managed_link "$NODE_ROOT/bin/hunkdiff" "$LOCAL_BIN/hunkdiff"

readonly TMUX_SOURCE="$REPO_ROOT/terminal/tmux/tmux.conf"
readonly TMUX_DESTINATION="$HOME/.tmux.conf"
[[ -f $TMUX_SOURCE ]] || die "missing tmux template: $TMUX_SOURCE"

if [[ -e $TMUX_DESTINATION || -L $TMUX_DESTINATION ]]; then
	if ! cmp --silent "$TMUX_SOURCE" "$TMUX_DESTINATION"; then
		mkdir -p "$BACKUP_DIR"
		cp -a "$TMUX_DESTINATION" "$BACKUP_DIR/tmux.conf"
		rm -f "$TMUX_DESTINATION"
		install -m 0644 "$TMUX_SOURCE" "$TMUX_DESTINATION"
	fi
else
	install -m 0644 "$TMUX_SOURCE" "$TMUX_DESTINATION"
fi

node_version="$(node --version)" || die "Node validation failed"
npm_version="$(npm --version)" || die "npm validation failed"
pi_version="$(pi --version)" || die "Pi validation failed"
hunk_version="$(hunk --version)" || die "Hunk validation failed"
tmux_version="$(tmux -V)" || die "tmux validation failed"
[[ $node_version == "v$NODE_VERSION" ]] || die "unexpected Node version after install: $node_version"
[[ $pi_version == "$PI_VERSION" ]] || die "unexpected Pi version after install: $pi_version"
[[ $hunk_version == *"$HUNK_VERSION"* ]] || die "unexpected Hunk version after install: $hunk_version"

printf '\nUbuntu homelab runtime installed.\n'
printf 'Node: %s (%s)\n' "$node_version" "$(command -v node)"
printf 'npm:  %s (%s)\n' "$npm_version" "$(command -v npm)"
printf 'Pi:   %s (%s)\n' "$pi_version" "$(command -v pi)"
printf 'Hunk: %s (%s)\n' "$hunk_version" "$(command -v hunk)"
printf 'tmux: %s\n' "$tmux_version"
printf '\nNext, apply the profile:\n'
printf '  export PATH="$HOME/.local/bin:$PATH"\n'
printf '  cd %q\n' "$REPO_ROOT"
printf '  node scripts/apply-pi-setup.mjs\n'
printf '\nThen start the authentication tmux session:\n'
printf '  tmux new-session -A -s pi-auth\n'
printf '\nAfter tmux attaches, run inside it:\n'
printf '  export PATH="$HOME/.local/bin:$PATH"\n'
printf '  cd %q\n' "$REPO_ROOT"
printf '  pi\n'
printf '  # Then run /login interactively.\n'
if [[ -d $BACKUP_DIR ]]; then
	printf 'Backup: %s\n' "$BACKUP_DIR"
fi
