#!/usr/bin/env node
// Exact-version compatibility backport, not a general npm dependency repair.
import {
	chmodSync,
	cpSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readlinkSync,
	renameSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { homedir } from "node:os";

const pins = {
	"pi-web-access": "0.17.1",
	"pi-lens": "3.8.74",
	"pi-subagents": "0.40.0",
};
const shadows = [
	"typebox",
	"pi-subagents/node_modules/typebox",
	"@earendil-works/pi-tui",
];
const commands = {
	"pi-lens": "cli.js",
	"pi-lens-analyze": "analyze-cli.js",
	"pi-lens-mcp": "server.js",
};
function readJson(path) {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch (cause) {
		throw new Error(`Cannot parse ${path}`, { cause });
	}
}
function stat(path) {
	try {
		return lstatSync(path);
	} catch (error) {
		if (error.code === "ENOENT") return undefined;
		throw error;
	}
}
function noSymlinks(path) {
	for (
		let part = path;
		part !== homedir() && part !== dirname(part);
		part = dirname(part)
	) {
		if (stat(part)?.isSymbolicLink())
			throw new Error(`Review unexpected symlink: ${part}`);
	}
}
function wrapperText(host, modules, compat, entry) {
	// JSON quoting keeps paths intact without introducing shell interpolation.
	return `#!/usr/bin/env node\nimport { spawnSync } from 'node:child_process';\nconst r = spawnSync(${JSON.stringify(process.execPath)}, [${JSON.stringify(join(compat, "pi-lens-host-cli.mjs"))}, ${JSON.stringify(host)}, ${JSON.stringify(join(modules, "pi-lens/dist/mcp", entry))}, ...process.argv.slice(2)], { stdio: 'inherit' });\nif (r.error) throw r.error;\nprocess.exit(r.status ?? 1);\n`;
}

export function inspectHostPeers(host, modules, compat) {
	const manifest = readJson(join(host, "package.json"));
	if (
		manifest.name !== "@earendil-works/pi-coding-agent" ||
		manifest.version !== "1.2.0"
	)
		throw new Error("Peer repair requires the reviewed Pi 1.2.0 npm runtime");
	noSymlinks(modules);
	noSymlinks(compat);
	const drift = [];
	for (const [name, version] of Object.entries(pins)) {
		const path = join(modules, name, "package.json");
		noSymlinks(path);
		if (!existsSync(path)) {
			drift.push(`${name}: missing`);
			continue;
		}
		const value = readJson(path);
		if (value.version !== version) {
			drift.push(`${name}: version`);
			continue;
		}
		for (const peer of [
			"typebox",
			...(name === "pi-lens" ? ["@earendil-works/pi-tui"] : []),
			...(name === "pi-subagents" ? ["@earendil-works/pi-ai"] : []),
		]) {
			if (value.dependencies?.[peer] || value.peerDependencies?.[peer] !== "*")
				drift.push(`${name}: ${peer}`);
		}
	}
	for (const relative of shadows) {
		const path = join(modules, relative);
		noSymlinks(path);
		if (stat(path)) drift.push(`shadow: ${relative}`);
	}
	const launcher = join(compat, "pi-lens-host-cli.mjs");
	noSymlinks(launcher);
	if (
		!existsSync(launcher) ||
		!readFileSync(launcher).equals(
			readFileSync(join(import.meta.dirname, "pi-lens-host-cli.mjs")),
		)
	)
		drift.push("Lens launcher");
	noSymlinks(join(modules, ".bin"));
	for (const [name, entry] of Object.entries(commands)) {
		const bin = join(modules, ".bin", name);
		if (stat(bin) && !stat(bin).isSymbolicLink())
			throw new Error(`Refusing non-symlink npm bin: ${bin}`);
		const wrapper = join(compat, "bin", name);
		noSymlinks(wrapper);
		if (!stat(bin) || readlinkSync(bin) !== wrapper)
			drift.push(`${name}: bin link`);
		if (
			!existsSync(wrapper) ||
			readFileSync(wrapper, "utf8") !==
				wrapperText(host, modules, compat, entry) ||
			!(stat(wrapper).mode & 0o111)
		)
			drift.push(`${name}: wrapper`);
	}
	return drift;
}

export function repairHostPeers(host, modules, backup, compat) {
	inspectHostPeers(host, modules, compat); // Preflight again after npm reconciliation.
	const manifests = Object.entries(pins).map(([name, version]) => {
		const path = join(modules, name, "package.json");
		const value = readJson(path);
		if (value.version !== version)
			throw new Error(`Review peer repair for ${name}@${value.version}`);
		return { name, path, value };
	});
	// The caller snapshots the complete npm tree first; retain changed files too.
	mkdirSync(backup, { recursive: true, mode: 0o700 });
	for (const { name, path, value } of manifests) {
		const saved = join(backup, name, "package.json");
		mkdirSync(dirname(saved), { recursive: true });
		cpSync(path, saved, { errorOnExist: true, force: false });
		value.peerDependencies ??= {};
		for (const peer of [
			"typebox",
			...(name === "pi-lens" ? ["@earendil-works/pi-tui"] : []),
			...(name === "pi-subagents" ? ["@earendil-works/pi-ai"] : []),
		]) {
			delete value.dependencies?.[peer];
			value.peerDependencies[peer] = "*";
		}
		writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
	}
	for (const relative of shadows) {
		const path = join(modules, relative);
		if (!existsSync(path)) continue;
		const saved = join(backup, "libraries", relative);
		mkdirSync(dirname(saved), { recursive: true });
		renameSync(path, saved);
	}
	if (existsSync(compat))
		cpSync(compat, join(backup, "previous-compat"), {
			recursive: true,
			dereference: false,
		});
	mkdirSync(join(compat, "bin"), { recursive: true });
	cpSync(
		join(import.meta.dirname, "pi-lens-host-cli.mjs"),
		join(compat, "pi-lens-host-cli.mjs"),
	);
	for (const [name, entry] of Object.entries(commands)) {
		const wrapper = join(compat, "bin", name);
		writeFileSync(wrapper, wrapperText(host, modules, compat, entry), {
			mode: 0o755,
		});
		chmodSync(wrapper, 0o755);
		const bin = join(modules, ".bin", name);
		if (stat(bin)) {
			mkdirSync(join(backup, "bin"), { recursive: true });
			symlinkSync(readlinkSync(bin), join(backup, "bin", name));
			unlinkSync(bin);
		}
		mkdirSync(dirname(bin), { recursive: true });
		symlinkSync(wrapper, bin);
	}
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	const args = process.argv.slice(2);
	if (args.length !== 4)
		throw new Error(
			"Usage: repair-pi-host-peers.mjs <Pi root> <node_modules> <new backup dir> <compat dir>",
		);
	if (existsSync(args[2])) throw new Error("Use a fresh backup directory");
	repairHostPeers(...args.map((path) => resolve(path)));
}
