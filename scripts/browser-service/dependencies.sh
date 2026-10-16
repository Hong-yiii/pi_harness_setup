#!/usr/bin/env bash
# Sourced by install.sh; no host changes until a function is explicitly called.
install_dependencies() (
	set -euo pipefail
	umask 077
	root=$1
	[[ $root == "$HOME/.local/share/pi-browser/dependencies.build-"* && ! -e $root ]] || {
		echo 'Refusing an existing or unreviewed dependency staging root' >&2
		exit 1
	}
	export PATH="$HOME/.local/bin:$PATH"
	node -e 'if (+process.versions.node.split(".")[0] < 22) process.exit(1)'
	command -v google-chrome >/dev/null
	mkdir -p "$root"/{debs,sysroot}
	cd "$root/debs"
	# apt verifies downloads against the configured repository index; no maintainer scripts run.
	apt-get download xvfb xserver-common x11vnc libvncserver1 libvncclient1 novnc python3-websockify python3-numpy python3-pkg-resources
	for deb in ./*.deb; do
		dpkg-deb -f "$deb" Package Version Architecture >>"$root/packages.txt"
		dpkg-deb -x "$deb" "$root/sysroot"
	done
	sha256sum ./*.deb >"$root/debs.sha256"
	cd "$root"
	printf '%s\n' '{"name":"pi-browser-dependencies","private":true,"type":"module","dependencies":{"playwright":"1.64.1"}}' >package.json
	npm install --ignore-scripts --no-audit --no-fund
	google-chrome --version >chrome-version.txt
	node --version >node-version.txt
)

check_dependencies() (
	set -euo pipefail
	root=$1
	(cd "$root/debs" && sha256sum --check ../debs.sha256 >/dev/null)
	"$HOME/.local/bin/node" --input-type=module - "$root" <<'JS'
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
assert.equal(JSON.parse(await readFile(`${root}/node_modules/playwright/package.json`, 'utf8')).version, '1.64.1');
await import(pathToFileURL(`${root}/node_modules/playwright/index.mjs`));
JS
	for binary in Xvfb x11vnc; do
		path="$root/sysroot/usr/bin/$binary"
		[[ -f $path && -x $path ]] || {
			echo "Missing executable dependency: $binary" >&2
			exit 1
		}
		if ! linkage=$(LD_LIBRARY_PATH="$root/sysroot/usr/lib/x86_64-linux-gnu" ldd "$path" 2>&1); then
			echo "Cannot inspect dependency: $binary" >&2
			exit 1
		fi
		if [[ $linkage == *'not found'* ]]; then
			echo "Unresolved libraries for dependency: $binary" >&2
			exit 1
		fi
	done
	PYTHONPATH="$root/sysroot/usr/lib/python3/dist-packages" python3 -c 'import websockify, numpy'
)
