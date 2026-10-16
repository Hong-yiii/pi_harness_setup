// Explicit Ubuntu trial, not an ambient Pi extension or persistent service.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { appendFileSync } from "node:fs";
import {
	mkdir,
	mkdtemp,
	readFile,
	rmdir,
	unlink,
	writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

process.umask(0o077);
const root = join(homedir(), ".local/share/pi-browser-trial");
const { chromium } = await import(
	pathToFileURL(join(root, "node_modules/playwright/index.mjs"))
);
const receiptPath = join(root, "current.json");

function assertLoopback(receipt) {
	const endpoint = URL.parse(receipt.endpoint);
	assert.equal(
		endpoint?.hostname,
		"127.0.0.1",
		"Invalid local browser endpoint",
	);
	const ports = [receipt.vncPort, receipt.webPort, Number(endpoint.port)];
	assert.ok(
		ports.every((port) => Number.isInteger(port) && port > 0 && port < 65536),
	);
	const result = spawnSync(
		"ss",
		[
			"-H",
			"-ltn",
			`( ${ports.map((port) => `sport = :${port}`).join(" or ")} )`,
		],
		{ encoding: "utf8" },
	);
	assert.equal(result.status, 0, "Listener inspection failed");
	const addresses = result.stdout
		.trim()
		.split("\n")
		.map((line) => line.trim().split(/\s+/)[3])
		.sort();
	assert.deepEqual(
		addresses,
		ports.map((port) => `127.0.0.1:${port}`).sort(),
		"Missing or non-loopback listener",
	);
}

if (process.argv[2] === "check") {
	let browser;
	try {
		const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
		assertLoopback(receipt);
		browser = await chromium.connectOverCDP(receipt.endpoint);
		const page = browser
			.contexts()[0]
			.pages()
			.find((p) => p.url().startsWith("data:text/html"));
		assert.ok(page, "The original synthetic page must still exist");
		assert.equal(await page.locator("#identity").textContent(), receipt.marker);
		const value = `playwright-${randomUUID()}`;
		await page.locator("#shared").fill(value);
		assert.equal(await page.locator("#shared").inputValue(), value);
		await page.locator("#count").click();
		assert.ok(Number(await page.locator("#result").textContent()) >= 1);
		console.log(
			"PASS: second Playwright client controls the original browser context/page",
		);
	} catch {
		console.error(
			"Check failed: invalid receipt, unavailable browser, or shared-page assertion failed",
		);
		process.exitCode = 1;
	} finally {
		await browser?.close(); // CDP client disconnect, not context.close().
	}
	process.exit(process.exitCode ?? 0);
}
assert.equal(process.argv[2], "start", "Usage: trial.mjs start|check");
// ponytail: one active trial per account; explicit stale-lock inspection after a crash.
const lock = join(root, "active");
await mkdir(lock, { mode: 0o700 });
await mkdir(join(root, "run"), { recursive: true, mode: 0o700 });
const run = await mkdtemp(join(root, "run", "trial-"));
const children = [];
let browser;
let published = false;
let stopping = false;

async function stop(code = 0) {
	if (stopping) return;
	stopping = true;
	clearTimeout(deadline);
	// Each component has its own process group AND an independent timeout.
	await Promise.race([browser?.close().catch(() => {}), delay(2000)]);
	for (const proc of [...children].reverse()) {
		const signal = (name) => {
			try {
				process.kill(-proc.pid, name);
			} catch (error) {
				if (error.code !== "ESRCH") throw error;
			}
		};
		signal("SIGTERM");
		if (proc.exitCode === null && proc.signalCode === null) {
			await Promise.race([once(proc, "exit"), delay(3000)]);
		}
		signal("SIGKILL"); // Also reap a websockify worker whose parent already exited.
	}
	if (published) await unlink(receiptPath);
	await rmdir(lock);
	console.log(`Trial stopped; private run files retained at ${run}`);
	process.exit(code);
}
const deadline = setTimeout(
	() => {
		void stop();
	},
	60 * 60 * 1000,
);
process.once("SIGTERM", () => {
	void stop();
});
process.once("SIGINT", () => {
	void stop();
});

function child(command, args, env = {}, displayPipe = false) {
	assert.ok(!stopping, "Startup cancelled");
	const proc = spawn(
		"/usr/bin/timeout",
		["--signal=TERM", "--kill-after=5s", "3600s", command, ...args],
		{
			detached: true,
			cwd: run,
			env: { ...process.env, ...env },
			stdio: ["ignore", "ignore", "pipe", ...(displayPipe ? ["pipe"] : [])],
		},
	);
	children.push(proc);
	if (proc.pid)
		appendFileSync(join(run, "process-groups"), `${proc.pid}\n`, {
			mode: 0o600,
		});
	// Never print browser endpoints, X cookies or passwords in logs.
	let diagnostic = "";
	proc.stderr.on("data", (data) => {
		diagnostic = (diagnostic + data).slice(-4000);
	});
	proc.once("error", (error) => {
		console.error(error.message);
		void stop(1);
	});
	proc.once("exit", (code, signal) => {
		if (!stopping) {
			console.error(
				`${command} exited unexpectedly (${code ?? signal}): ${diagnostic}`,
			);
			void stop(1);
		}
	});
	return proc;
}

async function freePort() {
	const server = createServer();
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const port = server.address().port;
	await new Promise((resolve) => server.close(resolve));
	return port; // A startup collision fails the trial; never kill another listener.
}

try {
	const sys = join(root, "sysroot/usr");
	const authority = join(run, "Xauthority");
	const cookie = randomBytes(16).toString("hex");
	await writeFile(authority, "", { mode: 0o600 });
	function authorize(display) {
		const result = spawnSync("xauth", ["-f", authority], {
			input: `add ${display} MIT-MAGIC-COOKIE-1 ${cookie}\n`,
			encoding: "utf8",
		});
		assert.equal(result.status, 0, "xauth failed");
	}
	authorize(":0");
	const x = child(
		join(sys, "bin/Xvfb"),
		[
			"-displayfd",
			"3",
			"-screen",
			"0",
			"1280x800x24",
			"-nolisten",
			"tcp",
			"-auth",
			authority,
		],
		{},
		true,
	);
	const displayNumber = await Promise.race([
		new Promise((resolve) => {
			let output = "";
			x.stdio[3].on("data", (data) => {
				output += data;
				if (output.includes("\n")) resolve(output.trim());
			});
		}),
		delay(15000).then(() => {
			throw new Error("Xvfb readiness timed out");
		}),
	]);
	assert.match(displayNumber, /^\d+$/);
	const display = `:${displayNumber}`;
	authorize(display);
	const env = { DISPLAY: display, XAUTHORITY: authority };
	const vncPort = await freePort();
	const webPort = await freePort();
	const passwordPath = join(run, "vnc-password");
	await writeFile(passwordPath, randomBytes(6).toString("base64") + "\n", {
		mode: 0o600,
	});
	child(
		join(sys, "bin/x11vnc"),
		[
			"-display",
			display,
			"-auth",
			authority,
			"-listen",
			"127.0.0.1",
			"-no6",
			"-noipv6",
			"-rfbport",
			String(vncPort),
			"-passwdfile",
			passwordPath,
			"-forever",
			"-shared",
			"-nosel",
			"-noremote",
		],
		{ ...env, LD_LIBRARY_PATH: join(sys, "lib/x86_64-linux-gnu") },
	);
	child(
		"/usr/bin/python3",
		[
			"-m",
			"websockify",
			"--web",
			join(sys, "share/novnc"),
			`127.0.0.1:${webPort}`,
			`127.0.0.1:${vncPort}`,
		],
		{ PYTHONPATH: join(sys, "lib/python3/dist-packages") },
	);
	const profile = join(run, "chrome-profile");
	// Chrome's sandbox stays enabled. Supervise the process tree, not just a CDP connection.
	child(
		"/usr/bin/google-chrome",
		[
			`--user-data-dir=${profile}`,
			"--remote-debugging-port=0",
			"--remote-debugging-address=127.0.0.1",
			"--window-size=1280,800",
			"--no-first-run",
			"--no-default-browser-check",
			"about:blank",
		],
		env,
	);
	let debugPort, debugPath;
	for (let attempt = 0; ; attempt++) {
		assert.ok(!stopping, "Startup cancelled");
		try {
			[debugPort, debugPath] = (
				await readFile(join(profile, "DevToolsActivePort"), "utf8")
			)
				.trim()
				.split("\n");
			assert.match(debugPort, /^\d+$/);
			assert.match(debugPath, /^\/devtools\/browser\/[a-zA-Z0-9-]+$/);
			break;
		} catch (error) {
			if (attempt >= 100) throw error;
			await delay(100);
		}
	}
	const endpoint = `ws://127.0.0.1:${debugPort}${debugPath}`;
	browser = await chromium.connectOverCDP(endpoint);
	assert.ok(!stopping, "Startup cancelled");
	browser.once("disconnected", () => {
		if (!stopping) void stop();
	});
	const page = browser.contexts()[0].pages()[0];
	const marker = randomUUID();
	await page.goto(
		"data:text/html;charset=utf-8," +
			encodeURIComponent(`<!doctype html><meta charset="utf-8"><title>Linux browser trial</title>
    <style>body{font:24px system-ui;margin:48px;background:#18212f;color:#f5f5ff}input,button{font:inherit;padding:12px}small{font-size:14px}</style>
    <h1>One Linux browser · two ways to control it</h1>
    <p>Playwright and this remote view share the same page.</p>
    <label>Shared text <input id="shared" value="Ready for you"></label>
    <p><button id="count" onclick="document.querySelector('#result').textContent=++window.clicks">Click me</button> Clicks: <span id="result">0</span></p>
    <p><small id="identity">${marker}</small></p><script>window.clicks=0</script>`),
	);
	assert.ok(!stopping, "Startup cancelled");
	const receipt = {
		pid: process.pid,
		run,
		marker,
		display,
		vncPort,
		webPort,
		passwordPath,
		endpoint,
		expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
	};
	await writeFile(
		join(run, "receipt.json"),
		JSON.stringify(receipt, null, 2) + "\n",
		{ mode: 0o600 },
	);
	assert.ok(!stopping, "Startup cancelled");
	await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + "\n", {
		mode: 0o600,
	});
	published = true;
	for (let attempt = 0; ; attempt++) {
		assert.ok(!stopping, "Startup cancelled");
		try {
			const response = await fetch(`http://127.0.0.1:${webPort}/vnc.html`);
			assert.equal(response.status, 200);
			break;
		} catch (error) {
			if (attempt >= 30) throw error;
			await delay(100);
		}
	}
	assertLoopback(receipt);
	console.log(
		JSON.stringify({
			ready: true,
			pid: process.pid,
			webPort,
			display,
			expiresAt: receipt.expiresAt,
		}),
	);
} catch (error) {
	// Playwright launch errors can contain private debugging endpoints; retain locally.
	await writeFile(
		join(run, "startup-error.txt"),
		String(error.stack ?? error),
		{ mode: 0o600 },
	);
	console.error(
		`Startup failed; diagnostic retained at ${run}/startup-error.txt`,
	);
	await stop(1);
}
