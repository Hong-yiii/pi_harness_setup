// Destructive ONLY to pi-browser.service. Refuses an already-running browser.
import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const root = join(homedir(), ".local/share/pi-browser");
const exec = promisify(execFile);
function call(request) {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [join(root, "current/cli.mjs")], {
			stdio: ["pipe", "pipe", "ignore"],
		});
		let output = "";
		const timer = setTimeout(() => {
			child.kill();
			reject(new Error("CLI deadline"));
		}, 45000);
		child.stdout.on("data", (bytes) => {
			output += bytes;
		});
		child.once("error", reject);
		child.once("exit", () => {
			clearTimeout(timer);
			try {
				resolve(JSON.parse(output));
			} catch {
				reject(new Error("Invalid CLI response"));
			}
		});
		child.stdin.end(JSON.stringify(request));
	});
}
assert.equal(
	(await call({ action: "status" })).result?.state,
	"stopped",
	"Explicitly stop the browser before this destructive smoke test",
);
const fixture = createServer((_req, res) => {
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.end(
		'<title>Shared browser acceptance</title><h1>Shared browser</h1><label>Name<input id="name"></label><button id="count" onclick="this.textContent=\'Clicked\'">Click</button>',
	);
});
await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));
const deadline = setTimeout(() => {
	fixture.close();
}, 180000);
const clientId = randomUUID(),
	other = randomUUID();
let started = false;
try {
	const control = join(homedir(), ".local/state/pi-browser/control.sock");
	const marker = `preserve-${randomUUID()}`;
	await writeFile(control, marker, { flag: "wx", mode: 0o600 });
	started = true;
	try {
		assert.equal((await call({ action: "start" })).ok, false);
		assert.equal(
			await readFile(control, "utf8"),
			marker,
			"Startup failure deleted the refused file",
		);
	} finally {
		if ((await readFile(control, "utf8").catch(() => "")) === marker)
			await unlink(control);
		await call({ action: "stop" });
	}
	console.log("PASS: refused control-path file survives failed startup");
	assert.equal((await call({ action: "start" })).result?.state, "ready");
	assert.equal((await call({ action: "claim", clientId })).ok, true);
	const opened = await call({
		action: "open",
		clientId,
		url: `http://127.0.0.1:${fixture.address().port}/`,
	});
	assert.equal(opened.ok, true);
	const tab = opened.result.tab;
	assert.equal(
		(
			await call({
				action: "fill",
				clientId,
				tab,
				selector: "#name",
				text: "same-browser-proof",
			})
		).ok,
		true,
	);
	assert.equal(
		(await call({ action: "click", clientId, tab, selector: "#count" })).ok,
		true,
	);
	assert.match(
		(await call({ action: "snapshot", clientId, tab })).result.text,
		/same-browser-proof/,
	);
	assert.match(
		(await call({ action: "snapshot", clientId, tab })).result.text,
		/Clicked/,
	);
	const shot = await call({ action: "screenshot", clientId, tab });
	assert.equal(
		Buffer.from(shot.result.image, "base64").subarray(1, 4).toString(),
		"PNG",
	);
	assert.equal(
		(await call({ action: "claim", clientId: other })).error?.code,
		"BROWSER_BUSY",
	);
	await call({ action: "release", clientId });
	assert.equal(
		(await call({ action: "click", clientId, tab, selector: "#count" })).error
			?.code,
		"LEASE_REQUIRED",
	);
	await call({ action: "claim", clientId: other });
	assert.match(
		(await call({ action: "snapshot", clientId: other, tab })).result.text,
		/same-browser-proof/,
	);
	console.log(
		"PASS: same-page client handoff, enforced lease, DOM actions and PNG screenshot",
	);

	const debug = (
		await readFile(join(root, "profile/DevToolsActivePort"), "utf8")
	)
		.trim()
		.split("\n");
	const { chromium } = await import(
		pathToFileURL(join(root, "dependencies/node_modules/playwright/index.mjs"))
	);
	const browser = await chromium.connectOverCDP(
		`ws://127.0.0.1:${debug[0]}${debug[1]}`,
	);
	const sandbox = await browser.contexts()[0].newPage();
	try {
		await sandbox.goto("chrome://sandbox");
		assert.match(
			await sandbox.locator("body").innerText(),
			/You are adequately sandboxed/,
		);
	} finally {
		await sandbox.close();
		await browser.close();
	}
	console.log("PASS: Chrome reports adequate sandboxing inside user systemd");

	const group = (
		await exec("systemctl", [
			"--user",
			"show",
			"pi-browser.service",
			"--property=ControlGroup",
			"--value",
		])
	).stdout.trim();
	assert.ok(group.startsWith("/user.slice/") && !group.includes(".."));
	await exec("systemctl", [
		"--user",
		"kill",
		"--kill-whom=main",
		"--signal=KILL",
		"pi-browser.service",
	]);
	let empty = false;
	for (let attempt = 0; attempt < 100; attempt++) {
		try {
			empty = !(
				await readFile(`/sys/fs/cgroup${group}/cgroup.procs`, "utf8")
			).trim();
		} catch (error) {
			if (error.code === "ENOENT") empty = true;
			else throw error;
		}
		if (empty) break;
		await delay(100);
	}
	assert.ok(empty, "Service crash left cgroup processes");
	assert.equal((await call({ action: "start" })).result?.state, "ready");
	await call({ action: "claim", clientId });
	assert.equal(
		(await call({ action: "snapshot", clientId, tab })).error?.code,
		"TAB_NOT_FOUND",
	);
	assert.equal((await call({ action: "stop" })).result?.state, "stopped");
	assert.equal((await call({ action: "status" })).result?.state, "stopped");
	console.log(
		"PASS: forced-controller-death cgroup cleanup, explicit restart, stale-tab rejection and graceful stop",
	);
} finally {
	if (started) await call({ action: "stop" }).catch(() => {});
	clearTimeout(deadline);
	fixture.closeAllConnections();
	await new Promise((resolve) => fixture.close(resolve));
}
