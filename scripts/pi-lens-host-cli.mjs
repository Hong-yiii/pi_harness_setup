#!/usr/bin/env node
// Standalone Lens CLIs need host peers; never preload this inside Pi itself.
import { registerHooks } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [host, entry, ...args] = process.argv.slice(2);
if (!host || !entry) {
	throw new Error(
		"Usage: pi-lens-host-cli.mjs <Pi package root> <Lens CLI entry> [args...]",
	);
}
const parentURL = pathToFileURL(join(resolve(host), "package.json")).href;
registerHooks({
	resolve(specifier, context, nextResolve) {
		const hostPeer = ["typebox", "@earendil-works/pi-tui"].some(
			(name) => specifier === name || specifier.startsWith(`${name}/`),
		);
		return nextResolve(
			specifier,
			hostPeer ? { ...context, parentURL } : context,
		);
	},
});
process.argv = [process.execPath, resolve(entry), ...args];
await import(pathToFileURL(resolve(entry)).href);
