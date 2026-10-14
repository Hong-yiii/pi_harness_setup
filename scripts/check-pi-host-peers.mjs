#!/usr/bin/env node
// Bounded load/schema/identity check for the homelab Pi 1.0.4 backport; no session/model call.
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

const [hostArg, modulesArg] = process.argv.slice(2);
if (!hostArg || !modulesArg) {
	throw new Error(
		"Usage: check-pi-host-peers.mjs <Pi package root> <extension node_modules>",
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
	const manifest = JSON.parse(readFileSync(file, "utf8"));
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
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
