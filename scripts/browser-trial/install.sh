#!/usr/bin/env bash
# Ubuntu 24.04 x86_64 trial only; no sudo or system package changes.
set -euo pipefail
umask 077
root="${PI_BROWSER_INSTALL_ROOT:-$HOME/.local/share/pi-browser-trial}"
[[ $root == "$HOME/.local/share/pi-browser-trial" || $root == "$HOME/.local/share/pi-browser/dependencies.build-"* ]] || {
	echo 'Refusing an unreviewed installation root' >&2
	exit 1
}
[[ $(uname -sm) == 'Linux x86_64' ]] || {
	echo 'Requires Linux x86_64' >&2
	exit 1
}
. /etc/os-release
[[ $ID == ubuntu && $VERSION_ID == 24.04 ]] || {
	echo 'Requires Ubuntu 24.04' >&2
	exit 1
}
[[ ! -e $root ]] || {
	echo "Refusing existing trial directory: $root" >&2
	exit 1
}
export PATH="$HOME/.local/bin:$PATH"
node -e 'if (+process.versions.node.split(".")[0] < 22) process.exit(1)'
command -v google-chrome >/dev/null
mkdir -p "$root"/{debs,sysroot,run}
cd "$root/debs"
# apt verifies downloads against the configured repository index; no maintainer scripts run.
apt-get download xvfb xserver-common x11vnc libvncserver1 libvncclient1 novnc python3-websockify python3-numpy python3-pkg-resources
for deb in ./*.deb; do
	dpkg-deb -f "$deb" Package Version Architecture >>"$root/packages.txt"
	dpkg-deb -x "$deb" "$root/sysroot"
done
sha256sum ./*.deb >"$root/debs.sha256"
cd "$root"
printf '%s\n' '{"name":"pi-browser-trial","private":true,"type":"module","dependencies":{"playwright":"1.64.1"}}' >package.json
npm install --ignore-scripts --no-audit --no-fund
export LD_LIBRARY_PATH="$root/sysroot/usr/lib/x86_64-linux-gnu"
for bin in Xvfb x11vnc; do
	if ldd "$root/sysroot/usr/bin/$bin" | grep 'not found'; then exit 1; fi
done
PYTHONPATH="$root/sysroot/usr/lib/python3/dist-packages" python3 -c 'import websockify, numpy'
google-chrome --version >chrome-version.txt
node --version >node-version.txt
printf 'Installed trial at %s (not started)\n' "$root"
