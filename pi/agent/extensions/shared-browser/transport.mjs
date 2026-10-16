import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createConnection, createServer } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export const TOOL_ACTIONS = [
	"status",
	"tabs",
	"open",
	"navigate",
	"snapshot",
	"click",
	"fill",
	"press",
	"screenshot",
	"close",
];
export const MAX_REQUEST = 32 * 1024;
export const MAX_RESPONSE = 8 * 1024 * 1024;
export const REMOTE_COMMAND =
	'exec "$HOME/.local/bin/node" "$HOME/.local/share/pi-browser/current/cli.mjs"';
const ACTIONS = [
	...TOOL_ACTIONS,
	"start",
	"stop",
	"claim",
	"release",
	"connection",
];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MESSAGES = {
	INVALID_REQUEST: "Invalid shared browser request.",
	BROWSER_UNAVAILABLE: "Browser unavailable; use /browser start explicitly.",
	SERVICE_UNAVAILABLE: "Shared browser service unavailable.",
	BROWSER_BUSY: "Another session owns browser automation.",
	LEASE_REQUIRED: "Use /browser connect in this Pi session first.",
	TAB_NOT_FOUND: "Tab not found; list tabs again.",
	LAST_TAB: "The last browser tab cannot be closed.",
	ACTION_FAILED: "Browser action failed.",
	RESPONSE_TOO_LARGE: "Shared browser response exceeds 8 MiB.",
	CONFIG_REQUIRED:
		"On Mac, configure ~/.config/pi-browser/client.json with a reviewed sshHost alias.",
	INVALID_CONFIG: "Invalid shared browser client configuration.",
	UNSUPPORTED_PLATFORM:
		"Shared browser supports Linux automation and Mac clients only.",
	REQUEST_TOO_LARGE: "Shared browser request exceeds 32 KiB.",
	INVALID_RESPONSE: "Invalid shared browser response.",
	TRANSPORT_UNAVAILABLE: "Shared browser transport unavailable.",
	TIMEOUT: "Shared browser request timed out.",
	CANCELLED: "Shared browser request cancelled.",
	SERVICE_ERROR: "Shared browser service rejected the request.",
	VIEW_UNAVAILABLE:
		"Native cmux viewer unavailable; check local cmux and SSH configuration.",
	VIEW_LOST:
		"Shared browser viewer tunnel disconnected; use /browser view to reconnect.",
	VIEW_REPURPOSED:
		"Viewer pane was repurposed; it was left untouched. Run /browser view for a new viewer.",
	SESSION_CLOSED: "Shared browser session is shutting down.",
};

export class BrowserError extends Error {
	constructor(code) {
		const safeCode = Object.hasOwn(MESSAGES, code) ? code : "SERVICE_ERROR";
		super(`${safeCode}: ${MESSAGES[safeCode]}`);
		this.code = safeCode;
	}
}
export const safeError = (error) =>
	error instanceof BrowserError ? error : new BrowserError("ACTION_FAILED");
const fail = (code) => {
	throw new BrowserError(code);
};
const object = (value) =>
	value !== null && typeof value === "object" && !Array.isArray(value);

export function encodeRequest(request) {
	if (
		!object(request) ||
		!ACTIONS.includes(request.action) ||
		!UUID.test(request.clientId)
	)
		fail("INVALID_REQUEST");
	for (const [key, value] of Object.entries(request)) {
		if (
			!["action", "clientId", "tab", "selector", "text", "url"].includes(key) ||
			typeof value !== "string"
		)
			fail("INVALID_REQUEST");
	}
	const input = `${JSON.stringify(request)}\n`;
	if (Buffer.byteLength(input) > MAX_REQUEST) fail("REQUEST_TOO_LARGE");
	return input;
}

export async function clientConfig({
	platform = process.platform,
	home = homedir(),
	read = readFile,
} = {}) {
	if (!["linux", "darwin"].includes(platform)) fail("UNSUPPORTED_PLATFORM");
	let config = {};
	try {
		const raw = await read(
			join(home, ".config/pi-browser/client.json"),
			"utf8",
		);
		if (Buffer.byteLength(raw) > MAX_REQUEST) fail("INVALID_CONFIG");
		config = JSON.parse(raw);
	} catch (error) {
		if (error?.code !== "ENOENT") fail("INVALID_CONFIG");
	}
	if (
		!object(config) ||
		Object.keys(config).some((key) => key !== "sshHost") ||
		(config.sshHost !== undefined &&
			(typeof config.sshHost !== "string" ||
				!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(config.sshHost)))
	)
		fail("INVALID_CONFIG");
	if (platform === "darwin" && !config.sshHost) fail("CONFIG_REQUIRED");
	return { platform, home, sshHost: config.sshHost };
}

function sshArgs() {
	return [
		"-T",
		"-o",
		"BatchMode=yes",
		"-o",
		"StrictHostKeyChecking=yes",
		"-o",
		"ConnectTimeout=10",
		"-o",
		"RemoteCommand=none",
		"-o",
		"PermitLocalCommand=no",
		"-o",
		"ForwardAgent=no",
		"-o",
		"ForwardX11=no",
		"-o",
		"ControlMaster=no",
		"-o",
		"ControlPath=none",
	];
}

export function requestCommand(config) {
	if (config.platform === "linux")
		return {
			file: process.execPath,
			args: [join(config.home, ".local/share/pi-browser/current/cli.mjs")],
		};
	if (config.platform !== "darwin") fail("UNSUPPORTED_PLATFORM");
	if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(config.sshHost ?? ""))
		fail("INVALID_CONFIG");
	return {
		file: "ssh",
		args: [
			...sshArgs(),
			"-o",
			"ClearAllForwardings=yes",
			config.sshHost,
			REMOTE_COMMAND,
		],
	};
}

/** One owned, bounded request child. Never surface stderr, spawn errors, or service messages. */
export function runJSON(
	{ file, args, env },
	input = "",
	{ signal, timeoutMs = 45_000, spawnChild = spawn } = {},
) {
	if (signal?.aborted) return Promise.reject(new BrowserError("CANCELLED"));
	return new Promise((resolve, reject) => {
		let child;
		let timer;
		let done = false;
		let bytes = 0;
		const chunks = [];
		const finish = (error, result) => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			signal?.removeEventListener("abort", abort);
			if (error && child) {
				child.kill("SIGKILL");
				child.stdin.destroy();
				child.stdout.destroy();
				child.unref();
			}
			if (error) reject(error);
			else resolve(result);
		};
		const abort = () => finish(new BrowserError("CANCELLED"));
		try {
			child = spawnChild(file, args, {
				env,
				stdio: ["pipe", "pipe", "ignore"],
			});
			child.once("error", () =>
				finish(new BrowserError("TRANSPORT_UNAVAILABLE")),
			);
			child.stdin.on("error", () => {}); // A nonzero CLI exit may still carry a valid JSON error.
			child.stdout.on("data", (chunk) => {
				if (done) return;
				bytes += chunk.length;
				if (bytes > MAX_RESPONSE)
					return finish(new BrowserError("RESPONSE_TOO_LARGE"));
				chunks.push(chunk);
			});
			child.once("close", () => {
				if (done) return;
				try {
					finish(null, JSON.parse(Buffer.concat(chunks).toString("utf8")));
				} catch {
					finish(new BrowserError("INVALID_RESPONSE"));
				}
			});
			timer = setTimeout(() => finish(new BrowserError("TIMEOUT")), timeoutMs);
			signal?.addEventListener("abort", abort, { once: true });
			if (signal?.aborted) return abort();
			child.stdin.end(input);
		} catch {
			finish(new BrowserError("TRANSPORT_UNAVAILABLE"));
		}
	});
}

export function unwrap(response) {
	if (!object(response) || typeof response.ok !== "boolean")
		fail("INVALID_RESPONSE");
	if (!response.ok) throw new BrowserError(response.error?.code);
	if (!object(response.result)) fail("INVALID_RESPONSE");
	return response.result;
}

export async function requestBrowser(
	request,
	{ signal, config, ...options } = {},
) {
	const input = encodeRequest(request);
	config ??= await clientConfig(options);
	return unwrap(await runJSON(requestCommand(config), input, { signal }));
}

/** Project protocol fields only: connection credentials must never reach tools or notifications. */
export function publicResult(action, result) {
	if (!object(result)) fail("INVALID_RESPONSE");
	const keys = ["tab", "url", "title", "closed", "completed"];
	const lifecycle = ["status", "start", "stop", "claim", "release"];
	if (!TOOL_ACTIONS.includes(action) && !lifecycle.includes(action))
		fail("INVALID_REQUEST");
	if (lifecycle.includes(action)) {
		if (
			!["ready", "stopped", "unavailable"].includes(result.state) ||
			(result.state === "ready" &&
				!["human", "automation"].includes(result.mode)) ||
			(result.mode !== undefined &&
				!["human", "automation"].includes(result.mode))
		)
			fail("INVALID_RESPONSE");
		return Object.fromEntries(
			["state", "mode", "generation", "leaseExpiresAt"]
				.filter((key) => Object.hasOwn(result, key))
				.map((key) => {
					if (
						result[key] !== null &&
						!["string", "number"].includes(typeof result[key])
					)
						fail("INVALID_RESPONSE");
					return [key, result[key]];
				}),
		);
	}
	if (action === "tabs") {
		if (!Array.isArray(result.tabs)) fail("INVALID_RESPONSE");
		return {
			tabs: result.tabs.map((tab) => {
				if (
					!object(tab) ||
					["id", "url", "title"].some((key) => typeof tab[key] !== "string")
				)
					fail("INVALID_RESPONSE");
				return { id: tab.id, url: tab.url, title: tab.title };
			}),
		};
	}
	if (action === "snapshot") {
		if (typeof result.tab !== "string" || typeof result.text !== "string")
			fail("INVALID_RESPONSE");
		keys.push("text");
	}
	if (action === "screenshot") {
		if (
			typeof result.tab !== "string" ||
			result.mimeType !== "image/png" ||
			typeof result.image !== "string" ||
			!/^[A-Za-z0-9+/]+={0,2}$/.test(result.image) ||
			!Buffer.from(result.image, "base64")
				.subarray(0, 8)
				.equals(Buffer.from("89504e470d0a1a0a", "hex"))
		)
			fail("INVALID_RESPONSE");
		keys.push("mimeType", "image");
	}
	return Object.fromEntries(
		keys
			.filter((key) => Object.hasOwn(result, key))
			.map((key) => {
				if (!["string", "boolean"].includes(typeof result[key]))
					fail("INVALID_RESPONSE");
				return [key, result[key]];
			}),
	);
}

export function toolResult(action, result) {
	const value = publicResult(action, result);
	return action === "screenshot"
		? {
				content: [{ type: "image", mimeType: "image/png", data: value.image }],
				details: undefined,
			}
		: {
				content: [{ type: "text", text: JSON.stringify(value) }],
				details: undefined,
			};
}

/** Native v2 socket RPC, never the CLI (which would put the password in argv). */
export function nativeRPC(
	socketPath,
	method,
	params,
	{ connect = createConnection, timeoutMs = 5000 } = {},
) {
	return new Promise((resolve, reject) => {
		const id = randomUUID();
		let socket;
		let timer;
		let buffer = Buffer.alloc(0);
		let done = false;
		const finish = (error, value) => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			socket?.destroy();
			if (error) reject(new BrowserError("VIEW_UNAVAILABLE"));
			else resolve(value);
		};
		try {
			socket = connect({ path: socketPath });
			timer = setTimeout(() => finish(true), timeoutMs);
			socket.on("connect", () =>
				socket.write(`${JSON.stringify({ id, method, params })}\n`),
			);
			socket.on("error", () => finish(true));
			socket.on("end", () => finish(true));
			socket.on("data", (chunk) => {
				if (buffer.length + chunk.length > MAX_RESPONSE) return finish(true);
				buffer = Buffer.concat([buffer, chunk]);
				const end = buffer.indexOf(10);
				if (end < 0) return;
				try {
					const response = JSON.parse(buffer.subarray(0, end).toString("utf8"));
					if (
						response.id !== id ||
						response.ok !== true ||
						!object(response.result)
					)
						return finish(true);
					finish(false, response.result);
				} catch {
					finish(true);
				}
			});
		} catch {
			finish(true);
		}
	});
}

export function credentialsScript(url, password) {
	// Check ownership and a real noVNC credential request in the SAME evaluation as secret delivery.
	return `(() => { if (location.href !== ${JSON.stringify(url)}) return false;
    const input = document.getElementById('noVNC_password_input');
    const button = document.getElementById('noVNC_credentials_button');
    const dialog = document.getElementById('noVNC_credentials_dlg');
    if (!input || !button || !dialog?.classList.contains('noVNC_open') || !input.getClientRects().length) return false;
    input.value = ${JSON.stringify(password)}; button.click(); input.value = ''; return true; })()`;
}

async function freePort() {
	const server = createServer();
	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", resolve);
	});
	const port = server.address().port;
	await new Promise((resolve) => server.close(resolve));
	return port;
}
async function listening(port) {
	return new Promise((resolve) => {
		const socket = createConnection({ host: "127.0.0.1", port });
		const finish = (value) => {
			socket.destroy();
			resolve(value);
		};
		socket.once("connect", () => finish(true));
		socket.once("error", () => finish(false));
		socket.setTimeout(250, () => finish(false));
	});
}
async function stopChild(child) {
	if (child.exitCode !== null || child.signalCode !== null) return;
	await new Promise((resolve) => {
		const timer = setTimeout(() => {
			child.kill("SIGKILL");
			resolve();
		}, 500);
		child.once("close", () => {
			clearTimeout(timer);
			resolve();
		});
		child.kill("SIGTERM");
	});
}

export async function viewerTunnel(
	config,
	remotePort,
	onLoss,
	{ spawnChild = spawn, allocate = freePort, ready = listening } = {},
) {
	requestCommand(config); // Validate host alias before starting a persistent transport.
	if (
		config.platform !== "darwin" ||
		!Number.isInteger(remotePort) ||
		remotePort < 1 ||
		remotePort > 65535
	)
		fail("VIEW_UNAVAILABLE");
	const port = await allocate();
	const args = [
		...sshArgs(),
		"-o",
		"ExitOnForwardFailure=yes",
		"-o",
		"GatewayPorts=no",
		"-o",
		"ForkAfterAuthentication=no",
		"-o",
		"ServerAliveInterval=15",
		"-o",
		"ServerAliveCountMax=2",
		"-N",
		"-L",
		`127.0.0.1:${port}:127.0.0.1:${remotePort}`,
		config.sshHost,
	];
	const child = spawnChild("ssh", args, {
		stdio: ["ignore", "ignore", "ignore"],
	});
	let alive = true;
	let intentional = false;
	let usable = false;
	const lost = () => {
		if (!alive) return;
		alive = false;
		if (!intentional && usable) onLoss();
	};
	child.once("error", lost);
	child.once("exit", lost);
	const stop = async () => {
		intentional = true;
		alive = false;
		await stopChild(child);
	};
	try {
		for (let i = 0; i < 100 && alive; i++) {
			// ExitOnForwardFailure must have time to report a port collision before trusting readiness.
			await delay(100);
			if (alive && (await ready(port)) && alive) {
				usable = true;
				return { port, stop, alive: () => alive };
			}
		}
		fail("VIEW_UNAVAILABLE");
	} catch {
		await stop();
		fail("VIEW_UNAVAILABLE");
	}
}

export function createViewer({
	config = clientConfig,
	cli = runJSON,
	rpc = nativeRPC,
	tunnel = viewerTunnel,
} = {}) {
	let ownView;
	const stop = async () => {
		const old = ownView;
		ownView = undefined;
		await old?.tunnel.stop();
		// ponytail: leave the browser workspace intact; it may have been repurposed by its human.
	};
	return {
		stop,
		async open(connection, onLoss) {
			try {
				if (
					!object(connection) ||
					!Number.isInteger(connection.port) ||
					connection.port < 1 ||
					connection.port > 65535 ||
					typeof connection.password !== "string" ||
					!connection.password.length ||
					connection.password.length > 1024 ||
					!UUID.test(connection.generation)
				)
					fail("VIEW_UNAVAILABLE");
				if (
					!ownView?.tunnel.alive() ||
					ownView.generation !== connection.generation
				) {
					await stop();
					const local = await config();
					if (local.platform !== "darwin") fail("VIEW_UNAVAILABLE");
					const identity = await cli(
						{
							file: "cmux",
							args: ["--json", "--id-format", "uuids", "identify", "--no-caller"],
						},
						"",
						{ timeoutMs: 5000 },
					);
					if (
						identity.app !== "cmux" ||
						typeof identity.socket_path !== "string" ||
						!identity.socket_path.startsWith("/")
					)
						fail("VIEW_UNAVAILABLE");
					const forward = await tunnel(local, connection.port, onLoss);
					ownView = { tunnel: forward, generation: connection.generation };
					const url = `http://127.0.0.1:${forward.port}/vnc.html?autoconnect=1&resize=scale`;
					// Verified against cmux 0.65.1 (8a853dcc9): native local browser-only layout, focus:false.
					const created = await cli(
						{
							file: "cmux",
							args: [
								"--json",
								"--id-format",
								"uuids",
								"rpc",
								"workspace.create",
								JSON.stringify({
									title: "Shared browser",
									focus: false,
									layout: { pane: { surfaces: [{ type: "browser", url }] } },
								}),
							],
						},
						"",
						{ timeoutMs: 5000 },
					);
					if (!UUID.test(created.workspace_id) || !UUID.test(created.surface_id))
						fail("VIEW_UNAVAILABLE");
					const target = {
						workspace_id: created.workspace_id,
						surface_id: created.surface_id,
					};
					Object.assign(ownView, { socket: identity.socket_path, target, url });
				}
				const { socket, target, url, tunnel: forward } = ownView;
				const deadline = Date.now() + 10_000;
				const evaluate = async (script) => {
					const remaining = deadline - Date.now();
					if (remaining <= 0 || !forward.alive()) fail("VIEW_UNAVAILABLE");
					const result = await rpc(
						socket, "browser.eval", { ...target, script },
						{ timeoutMs: Math.min(5000, remaining) },
					);
					if (!forward.alive() || Date.now() >= deadline) fail("VIEW_UNAVAILABLE");
					return result;
				};
				let submitted = false;
				while (Date.now() < deadline && forward.alive()) {
					// Default noVNC UI contract (1.3/1.6); button submission alone is not readiness.
					const state = await evaluate(`(() => {
            if (location.href !== ${JSON.stringify(url)}) return 'repurposed';
            const classes = document.documentElement.classList;
            if (classes.contains('noVNC_connected')) return 'connected';
            const input = document.getElementById('noVNC_password_input');
            const dialog = document.getElementById('noVNC_credentials_dlg');
            if (dialog?.classList.contains('noVNC_open') && input?.getClientRects().length && document.getElementById('noVNC_credentials_button')) return 'credentials';
            const pending = ['noVNC_loading', 'noVNC_connecting', 'noVNC_reconnecting'].some(name => classes.contains(name));
            if (!pending && document.getElementById('noVNC_connect_dlg')?.classList.contains('noVNC_open')) return 'disconnected';
            return 'pending';
          })()`);
					if (state.value === "repurposed") fail("VIEW_REPURPOSED");
					if (state.value === "connected") return;
					if (state.value === "disconnected") fail("VIEW_UNAVAILABLE");
					if (state.value === "credentials" && !submitted) {
						submitted = true;
						const result = await evaluate(
							credentialsScript(url, connection.password),
						);
						if (result.value !== true) fail("VIEW_REPURPOSED");
					}
					await delay(100);
				}
				fail("VIEW_UNAVAILABLE");
			} catch (error) {
				await stop();
				throw error instanceof BrowserError && error.code === "VIEW_REPURPOSED"
					? error
					: new BrowserError("VIEW_UNAVAILABLE");
			}
		},
	};
}

/** Private, nonpersistent client ID and explicit consent, scoped to one loaded extension runtime. */
export function createBrowserSession({
	request = requestBrowser,
	viewer = createViewer(),
	platform = process.platform,
} = {}) {
	const clientId = randomUUID();
	let connected = false;
	let leaseMayExist = false;
	let closed = false;
	let lifetime = new AbortController();
	let tail = Promise.resolve();
	const serial = (fn) => {
		const next = tail.then(fn);
		tail = next.catch(() => {});
		return next;
	};
	const call = (action, fields = {}, signal) => {
		const payload = { ...fields, action, clientId };
		encodeRequest(payload);
		return request(payload, {
			signal: signal
				? AbortSignal.any([signal, lifetime.signal])
				: lifetime.signal,
		});
	};
	const release = async () => {
		connected = false;
		const result = await call("release");
		leaseMayExist = false;
		return publicResult("release", result);
	};
	return {
		reset() {
			closed = false;
			lifetime = new AbortController();
			connected = false;
		},
		tool(params, signal) {
			return serial(async () => {
				if (closed) fail("SESSION_CLOSED");
				if (
					!object(params) ||
					!TOOL_ACTIONS.includes(params.action) ||
					Object.keys(params).some(
						(key) =>
							!["action", "tab", "selector", "text", "url"].includes(key),
					)
				)
					fail("INVALID_REQUEST");
				if (params.action !== "status" && !connected) fail("LEASE_REQUIRED");
				return toolResult(
					params.action,
					await call(params.action, params, signal),
				);
			});
		},
		command(action, onLoss = () => {}) {
			return serial(async () => {
				if (closed) fail("SESSION_CLOSED");
				if (action === "connect") {
					leaseMayExist = true; // A timed-out claim may already have succeeded remotely.
					connected = false;
					const result = publicResult("claim", await call("claim"));
					connected = result.state === "ready" && result.mode === "automation";
					return result;
				}
				if (["release", "handoff", "disconnect"].includes(action)) {
					try {
						return await release();
					} finally {
						if (action === "disconnect") await viewer.stop();
					}
				}
				if (action === "view") {
					if (platform !== "darwin")
						return {
							message:
								"Use a Mac Pi session with /browser view. Browser automation works on Linux.",
						};
					await viewer.open(await call("connection"), onLoss);
					return {
						message:
							"Shared browser opened in a local cmux workspace without taking focus.",
					};
				}
				if (!["start", "status", "stop"].includes(action))
					fail("INVALID_REQUEST");
				if (action === "stop") connected = false;
				try {
					return publicResult(action, await call(action));
				} finally {
					if (action === "stop") await viewer.stop();
				}
			});
		},
		async shutdown() {
			closed = true;
			connected = false;
			lifetime.abort();
			await tail;
			await viewer.stop();
			if (leaseMayExist) {
				try {
					await request(
						{ action: "release", clientId },
						{ signal: AbortSignal.timeout(2000) },
					);
					leaseMayExist = false;
				} catch {
					/* Best effort only; service TTL is the final lease cleanup owner. */
				}
			}
		},
	};
}
