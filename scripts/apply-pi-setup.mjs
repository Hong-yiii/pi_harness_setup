#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readlinkSync,
	renameSync,
	rmSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const userHome = homedir();
const agentDir = join(userHome, ".pi", "agent");
const settingsPath = join(agentDir, "settings.json");
const versionedSettingsPath = join(repoRoot, "pi", "agent", "settings.json");
const projectSettingsPath = join(repoRoot, ".pi", "settings.json");
const profilePath = join(
	repoRoot,
	"pi",
	"package-profiles",
	"lean-default.json",
);
const profile = readJson(profilePath);
const timestamp = new Date()
	.toISOString()
	.replaceAll(":", "-")
	.replaceAll(".", "-");
const harnessConfigDir = join(userHome, ".config", "pi_harness_setup");
const backupDir = join(harnessConfigDir, "backups", timestamp);

mkdirSync(agentDir, { recursive: true });
mkdirSync(backupDir, { recursive: true });

function run(command, args, options = {}) {
	process.stdout.write(`> ${command} ${args.join(" ")}\n`);
	execFileSync(command, args, { cwd: repoRoot, stdio: "inherit", ...options });
}

function readJson(path) {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch (error) {
		throw new Error(`Cannot parse JSON at ${path}: ${error.message}`, {
			cause: error,
		});
	}
}

function packageSource(entry) {
	return typeof entry === "string" ? entry : entry.source;
}

function matchesPackage(source, packageName) {
	const base = `npm:${packageName}`;
	return source === base || source.startsWith(`${base}@`);
}

function backUp(path, relativeName) {
	if (!existsSync(path)) return;
	const destination = join(backupDir, relativeName);
	mkdirSync(dirname(destination), { recursive: true });
	cpSync(path, destination, { recursive: true, dereference: false });
}

function copyHarnessAssets(kind) {
	const sourceDir = join(repoRoot, "pi", "agent", kind);
	const destinationDir = join(agentDir, kind);
	if (!existsSync(sourceDir)) return;
	mkdirSync(destinationDir, { recursive: true });
	cpSync(sourceDir, destinationDir, { recursive: true, force: true });
}

function copySelectedSkills() {
	const sharedSkillsDir = join(userHome, ".agents", "skills");
	mkdirSync(sharedSkillsDir, { recursive: true });
	for (const name of profile.skills) {
		const source = join(repoRoot, "skills", name);
		const destination = join(sharedSkillsDir, name);
		if (!existsSync(source))
			throw new Error(`Missing versioned skill: ${source}`);
		backUp(destination, join("shared-skills", name));
		rmSync(destination, { recursive: true, force: true });
		cpSync(source, destination, { recursive: true });
	}
}

if (existsSync(settingsPath)) backUp(settingsPath, "settings.json");

for (const entry of profile.packages) {
	run("pi", ["install", entry.source, "--approve"]);
}

copySelectedSkills();
cpSync(
	join(repoRoot, "terminal", "zsh", "piwt.zsh"),
	join(harnessConfigDir, "piwt.zsh"),
	{
		force: true,
	},
);

const settings = {
	...readJson(versionedSettingsPath),
	...(existsSync(settingsPath) ? readJson(settingsPath) : {}),
};
// Keep removed profile packages managed so applying the profile deactivates them.
const managedNames = [
	"pi-observability",
	"pi-web-access",
	"pi-lens",
	"@season179/pi-worktree",
	"pi-subagents",
	"@dietrichgebert/ponytail",
	"pi-background-tasks",
	"@quintinshaw/pi-dynamic-workflows",
	"@malinamnam/pi-phone",
];
const withoutManagedPackages = (packages = []) =>
	packages.filter((entry) => {
		const source = packageSource(entry);
		return !managedNames.some((name) => matchesPackage(source, name));
	});

settings.packages = [
	...withoutManagedPackages(settings.packages),
	...profile.packages.map(({ surface: _surface, ...entry }) =>
		Object.keys(entry).length === 1 ? entry.source : entry,
	),
];
settings.skills = [
	"!skills/**",
	...profile.skills.map((name) => `+skills/${name}`),
];
writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

if (existsSync(projectSettingsPath)) {
	backUp(projectSettingsPath, "project-settings.json");
	const projectSettings = readJson(projectSettingsPath);
	projectSettings.packages = withoutManagedPackages(projectSettings.packages);
	writeFileSync(
		projectSettingsPath,
		`${JSON.stringify(projectSettings, null, 2)}\n`,
	);
}

for (const kind of ["agents", "prompts"]) {
	const destination = join(agentDir, kind);
	backUp(destination, kind);
	copyHarnessAssets(kind);
}

const ponytailDir = join(userHome, ".config", "ponytail");
const ponytailConfigPath = join(ponytailDir, "config.json");
mkdirSync(ponytailDir, { recursive: true });
backUp(ponytailConfigPath, join("ponytail", "config.json"));
cpSync(
	join(repoRoot, "pi", "user-config", "ponytail-config.json"),
	ponytailConfigPath,
	{ force: true },
);

const extensionsDir = join(agentDir, "extensions");
const disabledDir = join(agentDir, "extensions.disabled");
mkdirSync(extensionsDir, { recursive: true });
mkdirSync(disabledDir, { recursive: true });

const bundledSubagent = join(extensionsDir, "subagent");
if (
	existsSync(bundledSubagent) &&
	lstatSync(bundledSubagent).isSymbolicLink()
) {
	const target = readlinkSync(bundledSubagent);
	if (target.includes("examples/extensions/subagent")) {
		renameSync(
			bundledSubagent,
			join(disabledDir, `subagent.bundled-example.${timestamp}`),
		);
	}
}

const npmRoot = execFileSync("npm", ["root", "-g"], {
	encoding: "utf8",
}).trim();
const planSource = join(
	npmRoot,
	"@earendil-works",
	"pi-coding-agent",
	"examples",
	"extensions",
	"plan-mode",
);
const planDestination = join(extensionsDir, "plan-mode");
if (existsSync(planSource)) {
	if (
		existsSync(planDestination) &&
		lstatSync(planDestination).isSymbolicLink()
	) {
		unlinkSync(planDestination);
	}
	if (!existsSync(planDestination)) symlinkSync(planSource, planDestination);
}

try {
	run("cmux", ["hooks", "pi", "install", "--yes"]);
} catch {
	process.stdout.write(
		"cmux hook skipped: cmux is not installed or not available.\n",
	);
}

process.stdout.write(`\nLean Pi setup applied. Backup: ${backupDir}\n`);
process.stdout.write("Restart Pi, then run: pi list\n");
process.stdout.write(
	"Optional zsh helper: source ~/.config/pi_harness_setup/piwt.zsh\n",
);
