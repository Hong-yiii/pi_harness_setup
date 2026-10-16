// The systemd user unit owns this process and its entire cgroup; Pi is only a client.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import {
	chmod,
	lstat,
	mkdir,
	readFile,
	unlink,
	writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { createServer as createHTTPServer } from "node:http";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import {
	MAX_REQUEST,
	MAX_RESPONSE,
	assertLoopback,
	createRouter,
	failure,
	fault,
} from "./protocol.mjs";

assert.equal(process.platform, "linux", "The browser service requires Linux");
assert.ok(
	process.env.INVOCATION_ID,
	"Start through systemctl --user start pi-browser.service",
);
process.umask(0o077);
const data = join(homedir(), ".local/share/pi-browser");
const state = join(homedir(), ".local/state/pi-browser");
const profile = join(data, "profile");
for (const dir of [data, state, profile]) {
	await mkdir(dir, { recursive: true, mode: 0o700 });
	const info = await lstat(dir);
	assert.ok(
		info.isDirectory() && info.uid === process.getuid() && !(info.mode & 0o077),
		"Browser directories must be private, owned directories",
	);
}
const socketPath = join(state, "control.sock");
const children = [];
const connections = new Set();
let browser,
	server,
	stopping = false,
	ownsSocket = false;

async function stop(code = 0) {
	if (stopping) return;
	stopping = true;
	for (const connection of connections) connection.destroy();
	server?.close();
	if (ownsSocket) await unlink(socketPath).catch(() => {});
	if (browser?.isConnected()) {
		await Promise.race([
			(async () => {
				const session = await browser.newBrowserCDPSession();
				await session.send("Browser.close");
			})().catch(() => {}),
			delay(3000),
		]);
	}
	for (const child of [...children].reverse()) child.kill("SIGTERM");
	// systemd KillMode=control-group also catches forked/reparented VNC and Chrome children.
	process.exit(code);
}
process.once("SIGTERM", () => {
	void stop();
});
process.once("SIGINT", () => {
	void stop();
});

function component(name, command, args, env = {}, displayPipe = false) {
	assert.ok(!stopping, "Startup cancelled");
	const log = createWriteStream(join(state, `${name}.log`), {
		flags: "w",
		mode: 0o600,
	});
	const child = spawn(command, args, {
		cwd: state,
		env: { ...process.env, ...env },
		stdio: ["ignore", "ignore", "pipe", ...(displayPipe ? ["pipe"] : [])],
	});
	children.push(child);
	child.stderr.pipe(log);
	child.once("error", () => {
		console.error(`${name} failed to start`);
		void stop(1);
	});
	child.once("exit", () => {
		if (!stopping) {
			console.error(`${name} exited`);
			void stop(1);
		}
	});
	return child;
}

async function freePort() {
	const server = createServer();
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const port = server.address().port;
	await new Promise((resolve) => server.close(resolve));
	return port; // Collision means fail closed, never terminate an existing listener.
}

try {
	try {
		const old = await lstat(socketPath);
		assert.ok(
			old.isSocket() && old.uid === process.getuid(),
			"Refusing unexpected control path",
		);
		await unlink(socketPath);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const sys = join(data, "dependencies/sysroot/usr");
	const authority = join(state, "Xauthority");
	await writeFile(authority, "", { mode: 0o600 });
	const cookie = randomBytes(16).toString("hex");
	function authorize(display) {
		const result = spawnSync("xauth", ["-f", authority], {
			input: `add ${display} MIT-MAGIC-COOKIE-1 ${cookie}\n`,
		});
		assert.equal(result.status, 0, "X authorization failed");
	}
	authorize(":0");
	const xvfb = component(
		"display",
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
	const number = await Promise.race([
		new Promise((resolve) => {
			let output = "";
			xvfb.stdio[3].on("data", (bytes) => {
				output += bytes;
				if (output.includes("\n")) resolve(output.trim());
			});
		}),
		delay(15000).then(() => {
			throw new Error("Display readiness timeout");
		}),
	]);
	assert.match(number, /^\d+$/);
	authorize(`:${number}`);
	const env = { DISPLAY: `:${number}`, XAUTHORITY: authority };
	const vncPort = await freePort();
	const port = await freePort();
	const password = randomBytes(6).toString("base64");
	const passwordPath = join(state, "vnc-password");
	await writeFile(passwordPath, `${password}\n`, { mode: 0o600 });
	component(
		"vnc",
		join(sys, "bin/x11vnc"),
		[
			"-display",
			env.DISPLAY,
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
	component(
		"viewer",
		"/usr/bin/python3",
		[
			"-m",
			"websockify",
			"--web",
			join(sys, "share/novnc"),
			`127.0.0.1:${port}`,
			`127.0.0.1:${vncPort}`,
		],
		{ PYTHONPATH: join(sys, "lib/python3/dist-packages") },
	);
	const debugFile = join(profile, "DevToolsActivePort");
	await unlink(debugFile).catch((error) => {
		if (error.code !== "ENOENT") throw error;
	});
	component(
		"chrome",
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
	); // Native Chrome's sandbox remains enabled.
	let debugPort, debugPath;
	for (let attempt = 0; ; attempt++) {
		assert.ok(!stopping, "Startup cancelled");
		try {
			[debugPort, debugPath] = (await readFile(debugFile, "utf8"))
				.trim()
				.split("\n");
			assert.match(debugPort, /^\d+$/);
			assert.match(debugPath, /^\/devtools\/browser\/[a-f0-9-]+$/i);
			break;
		} catch (error) {
			if (attempt >= 150) throw error;
			await delay(100);
		}
	}
	const { chromium } = await import(
		pathToFileURL(join(data, "dependencies/node_modules/playwright/index.mjs"))
	);
	browser = await chromium.connectOverCDP(
		`ws://127.0.0.1:${debugPort}${debugPath}`,
		{ timeout: 10000 },
	);
	assert.ok(!stopping, "Startup cancelled");
	browser.once("disconnected", () => {
		if (!stopping) void stop(1);
	});
	const ports = [vncPort, port, Number(debugPort)];
	for (let attempt = 0; ; attempt++) {
		try {
			const response = await fetch(`http://127.0.0.1:${port}/vnc.html`, {
				signal: AbortSignal.timeout(2000),
			});
			assert.equal(response.status, 200);
			const listeners = spawnSync(
				"ss",
				["-H", "-ltn", `( ${ports.map((p) => `sport = :${p}`).join(" or ")} )`],
				{ encoding: "utf8" },
			);
			assert.equal(listeners.status, 0);
			assertLoopback(listeners.stdout, ports);
			break;
		} catch (error) {
			if (attempt >= 30) throw error;
			await delay(100);
		}
	}
	// CDP can be available while Chrome's first network load is still stalled.
	// Prove an actual local HTTP navigation before advertising the browser as ready.
	const marker = randomUUID();
	const probe = createHTTPServer((_request, response) => {
		response.setHeader("Content-Type", "text/plain");
		response.setHeader("Cache-Control", "no-store");
		response.end(marker);
	});
	await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
	const probePage = await browser.contexts()[0].newPage();
	try {
		await probePage.goto(`http://127.0.0.1:${probe.address().port}/`, {
			timeout: 35000,
			waitUntil: "domcontentloaded",
		});
		assert.equal(await probePage.locator("body").innerText(), marker);
	} finally {
		await probePage.close().catch(() => {});
		probe.closeAllConnections();
		await new Promise((resolve) => probe.close(resolve));
	}
	const route = createRouter(browser, {
		generation: randomUUID(),
		port,
		password,
	});
	let queue = Promise.resolve();
	assert.ok(!stopping, "Startup cancelled");
	server = createServer((connection) => {
		connections.add(connection);
		connection.once("close", () => connections.delete(connection));
		connection.on("error", () => {});
		connection.setTimeout(40000, () => connection.destroy());
		let input = "",
			submitted = false;
		connection.setEncoding("utf8");
		connection.on("data", (bytes) => {
			if (submitted) return;
			input += bytes;
			if (Buffer.byteLength(input) > MAX_REQUEST) {
				connection.destroy();
				return;
			}
			if (!input.includes("\n")) return;
			submitted = true;
			queue = queue
				.then(async () => {
					if (connection.destroyed || stopping) return;
					let response;
					try {
						const request = JSON.parse(input);
						response = { ok: true, result: await route(request) };
					} catch (error) {
						response = failure(
							error instanceof SyntaxError ? fault("INVALID_REQUEST") : error,
						);
					}
					let output = JSON.stringify(response);
					if (Buffer.byteLength(output) > MAX_RESPONSE)
						output = JSON.stringify(failure(fault("RESPONSE_TOO_LARGE")));
					if (!connection.destroyed) connection.end(`${output}\n`);
				})
				.catch(() => connection.destroy());
		});
	});
	server.listen(socketPath);
	await once(server, "listening");
	ownsSocket = true;
	await chmod(socketPath, 0o600);
	console.log(
		"Browser service ready (private control socket; all browser listeners loopback)",
	);
} catch {
	console.error(
		"Browser service startup failed; inspect private component logs under ~/.local/state/pi-browser",
	);
	await stop(1);
}
