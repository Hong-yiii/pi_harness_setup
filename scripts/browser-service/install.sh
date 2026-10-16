#!/usr/bin/env bash
# Install only this on-demand user service; never mutate the system package database.
set -euo pipefail
umask 077
src=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
root="$HOME/.local/share/pi-browser"
state="$HOME/.local/state/pi-browser"
unit="$HOME/.config/systemd/user/pi-browser.service"
[[ $(uname -sm) == 'Linux x86_64' ]] || {
	echo 'Requires Ubuntu x86_64' >&2
	exit 1
}
. /etc/os-release
[[ $ID == ubuntu && $VERSION_ID == 24.04 ]] || {
	echo 'Requires Ubuntu 24.04' >&2
	exit 1
}
[[ -x "$HOME/.local/bin/node" ]] || {
	echo 'Managed Node is required' >&2
	exit 1
}
systemctl --user show-environment >/dev/null
for path in "$root" "$state" "$unit" "$root/dependencies"; do
	[[ ! -L $path ]] || {
		echo "Refusing symlink: $path" >&2
		exit 1
	}
done
version=$(cd "$src" && sha256sum service.mjs protocol.mjs cli.mjs | sha256sum | cut -c1-16)
release="$root/releases/$version"
if systemctl --user is-active --quiet pi-browser.service; then
	if [[ $(readlink "$root/current") == "releases/$version" ]] && cmp -s "$src/pi-browser.service" "$unit"; then
		printf 'Already installed and running: %s\n' "$version"
		exit 0
	fi
	echo 'Stop only pi-browser.service explicitly before updating it' >&2
	exit 1
fi
mkdir -p "$root/releases" "$state" "$(dirname "$unit")"
chmod 700 "$root" "$state"
if [[ ! -d $root/dependencies ]]; then
	dependency_stage="$root/dependencies.build-$$"
	[[ ! -e $dependency_stage ]] || {
		echo 'Staging path already exists' >&2
		exit 1
	}
	trap 'rm -rf -- "$dependency_stage"' EXIT
	PI_BROWSER_INSTALL_ROOT="$dependency_stage" bash "$src/../browser-trial/install.sh"
	mv "$dependency_stage" "$root/dependencies"
	trap - EXIT
fi
# Revalidate extracted artifacts and runtime; never assume a partial installation is complete.
(cd "$root/dependencies/debs" && sha256sum --check ../debs.sha256 >/dev/null)
"$HOME/.local/bin/node" --input-type=module - "$root/dependencies" <<'JS'
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
assert.equal(JSON.parse(await readFile(`${root}/node_modules/playwright/package.json`, 'utf8')).version, '1.64.1');
await import(pathToFileURL(`${root}/node_modules/playwright/index.mjs`));
JS
for binary in Xvfb x11vnc; do
	if LD_LIBRARY_PATH="$root/dependencies/sysroot/usr/lib/x86_64-linux-gnu" \
		ldd "$root/dependencies/sysroot/usr/bin/$binary" | grep 'not found'; then exit 1; fi
done
PYTHONPATH="$root/dependencies/sysroot/usr/lib/python3/dist-packages" python3 -c 'import websockify, numpy'
if [[ -e $release ]]; then
	for name in service.mjs protocol.mjs cli.mjs; do cmp "$src/$name" "$release/$name"; done
else
	staging=$(mktemp -d "$root/releases/.stage-XXXXXX")
	trap 'rm -rf -- "$staging"' EXIT
	cp "$src/"{service,protocol,cli}.mjs "$staging/"
	(cd "$staging" && sha256sum ./*.mjs >SHA256SUMS)
	mv "$staging" "$release"
	trap - EXIT
fi
backup="$root/backups/$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$backup"
if [[ -e $unit ]]; then cp -p "$unit" "$backup/pi-browser.service"; fi
if [[ -L $root/current ]]; then
	readlink "$root/current" >"$backup/previous-release"
elif [[ -e $root/current ]]; then
	echo 'Refusing non-symlink current release' >&2
	exit 1
fi
cp "$src/pi-browser.service" "$unit"
ln -s "releases/$version" "$root/current.new-$$"
mv -Tf "$root/current.new-$$" "$root/current"
systemctl --user daemon-reload
printf 'Installed release %s; service is not started/enabled. Backup: %s\n' "$version" "$backup"
