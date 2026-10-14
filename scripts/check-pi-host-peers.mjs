#!/usr/bin/env node
// Bounded Pi 1.0.4/1.2.0 backport and optional shared-resource check; no session/model call.
import assert from "node:assert/strict";
import {
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function readJson(path) {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch (cause) {
		throw new Error(`Cannot parse ${path}`, { cause });
	}
}

const [hostArg, modulesArg, agentArg] = process.argv.slice(2);
if (!hostArg || !modulesArg) {
	throw new Error(
		"Usage: check-pi-host-peers.mjs <Pi package root> <extension node_modules> [agent directory]",
	);
}
const host = resolve(hostArg);
const modules = resolve(modulesArg);
const chunks = join(host, "dist/bundle/chunks");
const virtualFiles = readdirSync(chunks).filter((name) =>
	/^virtual-modules-.*\.js$/.test(name),
);
assert.equal(
	virtualFiles.length,
	1,
	"Review this check for the installed Pi build",
);
const { VIRTUAL_MODULES } = await import(
	pathToFileURL(join(chunks, virtualFiles[0])).href
);
const { DefaultResourceLoader, SettingsManager } =
	VIRTUAL_MODULES["@earendil-works/pi-coding-agent"];
const names = ["pi-web-access", "pi-lens", "pi-subagents"];
for (const name of names) {
	const file = join(modules, name, "package.json");
	const manifest = readJson(file);
	for (const peer of [
		"typebox",
		...(name === "pi-lens" ? ["@earendil-works/pi-tui"] : []),
	]) {
		assert.ok(
			!(peer in manifest.dependencies),
			`${name}: ${peer} must not be a dependency`,
		);
		assert.equal(manifest.peerDependencies[peer], "*");
		assert.throws(
			() => createRequire(file).resolve(peer),
			{ code: "MODULE_NOT_FOUND" },
			`${name}: native resolution must not bypass Pi's embedded modules`,
		);
	}
}
const scratch = mkdtempSync(join(tmpdir(), "pi-peer-check-"));
try {
	// This catches the tempting but incorrect fix of symlinking a physical host TUI copy.
	const probe = join(scratch, "identity.ts");
	writeFileSync(
		probe,
		`import assert from 'node:assert/strict';
import { Text } from '@earendil-works/pi-tui';
import { Text as LensText } from ${JSON.stringify(join(modules, "pi-lens/dist/clients/deps/pi-tui.js"))};
export default function () { assert.equal(LensText, Text, 'Lens/Pi TUI class identity'); }
`,
	);
	const loader = new DefaultResourceLoader({
		cwd: scratch,
		agentDir: join(scratch, "agent"),
		settingsManager: SettingsManager.inMemory({
			packages: names.map((name) => ({
				source: join(modules, name),
				skills: [],
				prompts: [],
			})),
		}),
		additionalExtensionPaths: [probe],
		noSkills: true,
		noPromptTemplates: true,
		noThemes: true,
		noContextFiles: true,
	});
	await loader.reload();
	const { extensions, errors, warnings = [] } = loader.getExtensions();
	assert.deepEqual(errors, []);
	assert.deepEqual(warnings, []);
	assert.equal(extensions.length, 4);
	const tools = extensions.flatMap((extension) => [
		...extension.tools.values(),
	]);
	assert.equal(tools.length, 20);
	for (const { definition } of tools)
		VIRTUAL_MODULES["typebox/compile"].Compile(definition.parameters);
	console.log(
		"PASS: no warnings/errors, 20 tool schemas, wildcard peers, no shadow copies, shared TUI class",
	);
	if (agentArg) {
		const agent = resolve(agentArg);
		const settings = readJson(join(agent, "settings.json"));
		const profile = readJson(
			join(import.meta.dirname, "../pi/package-profiles/lean-default.json"),
		);
		// Check deployed filters before resolving locally; never fetch unmanaged extras.
		const packageName = (entry) =>
			(typeof entry === "string" ? entry : entry.source)
				.replace(/^npm:/, "")
				.replace(/@[^@/]+$/, "");
		for (const { surface: _surface, ...entry } of profile.packages) {
			const actual = settings.packages.filter(
				(item) => packageName(item) === packageName(entry),
			);
			assert.deepEqual(
				actual,
				[Object.keys(entry).length === 1 ? entry.source : entry],
				`deployed filters: ${entry.source}`,
			);
		}
		settings.packages = profile.packages.map(
			({ surface: _surface, ...entry }) => ({
				...entry,
				source: join(
					modules,
					entry.source.slice(4, entry.source.lastIndexOf("@")),
				),
			}),
		);
		const full = new DefaultResourceLoader({
			cwd: scratch,
			agentDir: agent,
			settingsManager: SettingsManager.inMemory(settings),
			noContextFiles: true,
		});
		await full.reload();
		const loaded = full.getExtensions();
		assert.deepEqual(loaded.errors, []);
		assert.deepEqual(loaded.warnings ?? [], []);
		const commands = loaded.extensions.flatMap((extension) => [
			...extension.commands.keys(),
		]);
		assert.ok(commands.includes("btw:ask"));
		assert.ok(commands.includes("open-tui"));
		assert.ok(!commands.includes("obs"), "Observability UI must be disabled");
		for (const { definition } of loaded.extensions.flatMap((extension) => [
			...extension.tools.values(),
		]))
			VIRTUAL_MODULES["typebox/compile"].Compile(definition.parameters);
		for (const resources of [
			full.getSkills(),
			full.getPrompts(),
			full.getThemes(),
		])
			assert.deepEqual(resources.diagnostics, []);
		const skills = full.getSkills().skills.map((skill) => skill.name);
		for (const name of [...profile.skills, "btw"])
			assert.equal(skills.filter((skill) => skill === name).length, 1, name);
		assert.deepEqual(
			full.getThemes().themes.map((theme) => theme.name),
			["neon-sakura"],
		);
		assert.ok(
			full
				.getPrompts()
				.prompts.some((prompt) => prompt.name === "deep-research"),
		);
		console.log(
			"PASS: shared profile loads, BTW command + skill, Open TUI alone, neon-sakura, selected skills/prompts; no resource warnings",
		);
	}
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
