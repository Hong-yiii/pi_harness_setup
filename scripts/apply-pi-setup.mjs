#!/usr/bin/env node
// One portable profile, applied independently on each host. No credentials or sessions.
import { execFileSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	readlinkSync,
	realpathSync,
	renameSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { inspectHostPeers, repairHostPeers } from "./repair-pi-host-peers.mjs";

const root = resolve(import.meta.dirname, "..");
const home = homedir();
const agent = join(home, ".pi/agent");
const config = join(home, ".config/pi_harness_setup");
const modules = join(agent, "npm/node_modules");
const args = process.argv.slice(2);
if (
	args.some(
		(arg) => !["--check", "--assets-only", "--repair-peers"].includes(arg),
	)
)
	throw new Error(
		"Usage: apply-pi-setup.mjs [--check | --assets-only | --repair-peers]",
	);
if (args.length > 1) throw new Error("Choose one apply mode");
const check = args.includes("--check");
const assetsOnly = args.includes("--assets-only");
if (
	process.env.PI_CODING_AGENT_DIR &&
	resolve(process.env.PI_CODING_AGENT_DIR) !== agent
)
	throw new Error(
		"Unset PI_CODING_AGENT_DIR: this operation manages ~/.pi/agent only",
	);

function readJson(path, fallback) {
	if (!existsSync(path) && fallback !== undefined) return fallback;
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
function safeDestination(path) {
	if (!path.startsWith(`${home}/`))
		throw new Error(`Destination outside HOME: ${path}`);
	for (let part = path; part !== home; part = dirname(part)) {
		if (stat(part)?.isSymbolicLink())
			throw new Error(`Review symlink before publication: ${part}`);
	}
	if (stat(path) && !stat(path).isFile())
		throw new Error(`Expected a file: ${path}`);
}
function merge(base, managed) {
	const result = { ...base };
	for (const [key, value] of Object.entries(managed)) {
		result[key] =
			value && typeof value === "object" && !Array.isArray(value)
				? merge(base?.[key] ?? {}, value)
				: value;
	}
	return result;
}
const encode = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const source = (entry) => (typeof entry === "string" ? entry : entry.source);
const packageName = (entry) =>
	source(entry)
		.replace(/^npm:/, "")
		.replace(/@[^@/]+$/, "");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const profile = readJson(join(root, "pi/package-profiles/lean-default.json"));
const runtime = execFileSync("pi", ["--version"], { encoding: "utf8" }).trim();
if (runtime !== profile.runtime.pi)
	throw new Error(
		`Pi ${runtime} != shared pin ${profile.runtime.pi}; update the runtime deliberately first (see bootstrap guide)`,
	);
const project = readJson(join(root, ".pi/settings.json"), {});
if ((project.packages ?? []).length)
	throw new Error(
		"Review/remove the project-local package profile first; do not duplicate the user harness",
	);
const template = readJson(join(root, "pi/agent/settings.json"));
safeDestination(join(agent, "settings.json"));
const current = readJson(join(agent, "settings.json"), {});
const managedNames = [...profile.packages, ...profile.excluded].map(
	packageName,
);
const settings = {
	...template,
	...current,
	// Interactive provider/model/thinking preferences remain local; these fields converge.
	theme: template.theme,
	subagents: merge(current.subagents ?? {}, template.subagents),
	skills: ["!skills/**", ...profile.skills.map((name) => `+skills/${name}`)],
	packages: [
		...(current.packages ?? []).filter(
			(entry) => !managedNames.includes(packageName(entry)),
		),
		...profile.packages.map(({ surface: _surface, ...entry }) =>
			Object.keys(entry).length === 1 ? entry.source : entry,
		),
	],
};
const files = [];
function add(path, bytes, mode = 0o600) {
	safeDestination(path);
	const old = existsSync(path) ? readFileSync(path) : null;
	if (!old?.equals(bytes))
		files.push({ path, bytes, old, mode: stat(path)?.mode ?? mode });
}
function addJson(path, value) {
	safeDestination(path);
	// Pi can reorder keys when saving preferences; only values represent drift.
	if (!existsSync(path) || !isDeepStrictEqual(readJson(path), value))
		add(path, encode(value));
}
function copyFile(from, to) {
	add(to, readFileSync(from), stat(from).mode);
}
function copyTree(from, to) {
	for (const entry of readdirSync(from, { withFileTypes: true })) {
		if (entry.isDirectory())
			copyTree(join(from, entry.name), join(to, entry.name));
		else if (entry.isFile())
			copyFile(join(from, entry.name), join(to, entry.name));
		else throw new Error(`Unexpected source entry: ${join(from, entry.name)}`);
	}
}
addJson(join(agent, "settings.json"), settings);
for (const kind of ["agents", "prompts"])
	copyTree(join(root, "pi/agent", kind), join(agent, kind));
copyFile(join(root, "pi/agent/AGENTS.md"), join(agent, "AGENTS.md"));
for (const name of profile.skills)
	copyTree(join(root, "skills", name), join(home, ".agents/skills", name));
copyFile(join(root, "terminal/zsh/piwt.zsh"), join(config, "piwt.zsh"));
copyFile(
	join(root, "pi/user-config/ponytail-config.json"),
	join(home, ".config/ponytail/config.json"),
);
for (const name of ["extensions/subagent/config.json", "open-tui.json"]) {
	const target = join(agent, name);
	safeDestination(target);
	addJson(
		target,
		merge(readJson(target, {}), readJson(join(root, "pi/agent", name))),
	);
}
const missing = profile.packages.filter((entry) => {
	const version = entry.source.slice(entry.source.lastIndexOf("@") + 1);
	const path = join(modules, packageName(entry), "package.json");
	safeDestination(path);
	return readJson(path, {}).version !== version;
});
const piPackage = "@earendil-works/pi-coding-agent";
function findPiHost(bin) {
	if (!bin) return undefined;
	for (let path = dirname(realpathSync(bin)); ; path = dirname(path)) {
		if (readJson(join(path, "package.json"), {}).name === piPackage) return path;
		if (path === dirname(path)) return undefined;
	}
}
const bins = process.env.PATH.split(":")
	.map((path) => join(path, "pi"))
	.filter((path) => existsSync(path));
let host = findPiHost(bins[0]);
if (!host) {
	// ponytail: forwarding launchers use the same global npm install; custom prefixes
	// must expose a direct Pi symlink. Resolve metadata rather than parsing wrappers.
	let npmRoot;
	try {
		npmRoot = execFileSync("npm", ["root", "-g"], {
			encoding: "utf8",
			timeout: 10000,
		}).trim();
	} catch (cause) {
		throw new Error("Cannot resolve npm Pi host behind this launcher; expose the npm Pi CLI directly on PATH", { cause });
	}
	if (!isAbsolute(npmRoot) || /[\r\n]/.test(npmRoot))
		throw new Error("Invalid npm Pi host root: expected one absolute path");
	const candidate = join(npmRoot, piPackage);
	const manifest = readJson(join(candidate, "package.json"), {});
	if (manifest.name !== piPackage || manifest.version !== profile.runtime.pi)
		throw new Error(`npm Pi host must be ${piPackage}@${profile.runtime.pi}; expose the intended npm Pi CLI directly on PATH`);
	host = realpathSync(candidate);
	const otherHosts = bins.slice(1).map(findPiHost).filter(Boolean);
	if (otherHosts.some((path) => path !== host))
		throw new Error("Ambiguous npm Pi host: PATH and npm resolve different installations; expose the intended npm Pi CLI directly on PATH");
}
if (readJson(join(host, "package.json"), {}).version !== profile.runtime.pi)
	throw new Error(`npm Pi host version does not match shared pin ${profile.runtime.pi}`);
const compat = join(config, "compat/shared-host-peers");
const peerDrift = inspectHostPeers(host, modules, compat);
const planSource = join(host, "examples/extensions/plan-mode");
const planTarget = join(agent, "extensions/plan-mode");
safeDestination(join(agent, "extensions/.preflight"));
if (!existsSync(planSource))
	throw new Error(`Missing bundled plan mode: ${planSource}`);
if (stat(planTarget) && !stat(planTarget).isSymbolicLink())
	throw new Error(`Review existing plan-mode directory: ${planTarget}`);
const planDrift = !stat(planTarget) || readlinkSync(planTarget) !== planSource;
// npm may rewrite settings even when they initially match. Always retain/republish them.
if (
	missing.length &&
	!files.some((file) => file.path === join(agent, "settings.json"))
) {
	files.push({
		path: join(agent, "settings.json"),
		bytes: encode(settings),
		old: readFileSync(join(agent, "settings.json")),
		mode: 0o600,
	});
}
for (const entry of missing) console.log(`PACKAGE ${entry.source}`);
for (const file of files) console.log(`ASSET ~/${relative(home, file.path)}`);
for (const item of peerDrift) console.log(`COMPAT ${item}`);
if (planDrift) console.log("HOST bundled plan-mode link");
const drift = missing.length || files.length || peerDrift.length || planDrift;
if (check) {
	console.log(
		drift
			? "DRIFT: run the reviewed apply procedure"
			: "PASS: shared runtime, package pins, filters, assets and host compatibility match",
	);
	process.exit(drift ? 1 : 0);
}
if (assetsOnly && (missing.length || peerDrift.length || planDrift))
	throw new Error(
		"Resolve package/compatibility/plan-mode drift with normal apply before --assets-only",
	);
const repair =
	!assetsOnly &&
	(missing.length > 0 ||
		peerDrift.length > 0 ||
		args.includes("--repair-peers"));
if (!drift && !repair) {
	console.log("Already current; no writes or installs.");
	process.exit(0);
}
safeDestination(join(config, "backups", ".preflight"));
const backup = join(
	config,
	"backups",
	`${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}-shared-parity`,
);
mkdirSync(backup, { recursive: true, mode: 0o700 });
const receipt = {
	runtime,
	status: "prepared",
	files: files.map(({ path, old, bytes }) => ({
		path: relative(home, path),
		before: old ? hash(old) : null,
		after: hash(bytes),
	})),
	packages: missing.map(source),
	npmSnapshot: repair && existsSync(join(agent, "npm")),
	npmOriginallyAbsent: !existsSync(join(agent, "npm")),
	planMode: planDrift
		? {
				before: stat(planTarget) ? readlinkSync(planTarget) : null,
				after: planSource,
			}
		: null,
};
const receiptPath = join(backup, "receipt.json");
const saveReceipt = () =>
	writeFileSync(receiptPath, encode(receipt), { mode: 0o600 });
for (const file of files) {
	if (!file.old) continue;
	const target = join(backup, "files", relative(home, file.path));
	mkdirSync(dirname(target), { recursive: true });
	cpSync(file.path, target, { preserveTimestamps: true });
}
if (receipt.npmSnapshot)
	cpSync(join(agent, "npm"), join(backup, "npm"), {
		recursive: true,
		dereference: false,
		verbatimSymlinks: true,
	});
if (planDrift && stat(planTarget))
	symlinkSync(readlinkSync(planTarget), join(backup, "plan-mode"));
saveReceipt();
console.log(`Recovery: ${backup}`);
try {
	for (const entry of missing) {
		execFileSync("pi", ["install", entry.source, "--no-approve"], {
			cwd: root,
			stdio: "inherit",
			env: { ...process.env, npm_config_ignore_scripts: "true" },
		});
	}
	if (repair)
		repairHostPeers(host, modules, join(backup, "host-peers"), compat);
	for (const entry of profile.packages) {
		const installed = readJson(
			join(modules, packageName(entry), "package.json"),
		);
		if (
			installed.version !==
			entry.source.slice(entry.source.lastIndexOf("@") + 1)
		)
			throw new Error(`Installed pin mismatch: ${entry.source}`);
	}
	for (const file of files) {
		safeDestination(file.path);
		mkdirSync(dirname(file.path), { recursive: true });
		const temporary = `${file.path}.harness-${process.pid}`;
		writeFileSync(temporary, file.bytes, { mode: file.mode, flag: "wx" });
		renameSync(temporary, file.path);
	}
	// Plan mode is host-provided; never copy the Mac's absolute extension path.
	if (planDrift) {
		mkdirSync(dirname(planTarget), { recursive: true });
		if (stat(planTarget)) unlinkSync(planTarget);
		symlinkSync(planSource, planTarget);
	}
	receipt.status = "applied";
	saveReceipt();
	console.log(
		"Applied shared profile. Run --check and the loader smoke; open a fresh Pi for the UI. Do not reload while background jobs run.",
	);
} catch (error) {
	receipt.status = "failed";
	saveReceipt();
	console.error(`Apply failed; preserve this recovery directory: ${backup}`);
	throw error;
}
