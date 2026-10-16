import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import {
	BrowserError,
	MAX_REQUEST,
	MAX_RESPONSE,
	REMOTE_COMMAND,
	TOOL_ACTIONS,
	clientConfig,
	createBrowserSession,
	createViewer,
	credentialsScript,
	encodeRequest,
	nativeRPC,
	publicResult,
	requestCommand,
	runJSON,
	safeError,
	unwrap,
	viewerTunnel,
} from "../pi/agent/extensions/shared-browser/transport.mjs";

const ID = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const status = { state: "ready", mode: "automation", generation: ID };
const png =
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jU1sAAAAASUVORK5CYII=";
const connection = {
	port: 6080,
	password: 'synthetic-private-"\\\n-canary',
	generation: ID,
};
const missing = async () => {
	throw Object.assign(new Error("private path"), { code: "ENOENT" });
};
const mac = { platform: "darwin", home: "/synthetic", sshHost: "homelab" };
const code = (expected) => (error) =>
	error instanceof BrowserError && error.code === expected;
const node = (script) => ({ file: process.execPath, args: ["-e", script] });

test("request schema allows only fixed actions and string fields, with a byte limit", () => {
	assert.deepEqual(
		JSON.parse(encodeRequest({ action: "press", clientId: ID, text: "Enter" })),
		{ action: "press", clientId: ID, text: "Enter" },
	);
	for (const request of [
		{ action: "eval", clientId: ID },
		{ action: "cookies", clientId: ID },
		{ action: "status", clientId: "bad" },
		{ action: "status", clientId: ID, endpoint: "http://decoy" },
		{ action: "fill", clientId: ID, text: 1 },
	])
		assert.throws(() => encodeRequest(request), code("INVALID_REQUEST"));
	const request = { action: "fill", clientId: ID, text: "" };
	request.text = "x".repeat(
		MAX_REQUEST - Buffer.byteLength(encodeRequest(request)),
	);
	assert.equal(Buffer.byteLength(encodeRequest(request)), MAX_REQUEST);
	assert.throws(
		() => encodeRequest({ ...request, text: `${request.text}é` }),
		code("REQUEST_TOO_LARGE"),
	);
});

test("host-local config is optional on Linux and requires a safe alias on Mac", async () => {
	assert.equal(
		(
			await clientConfig({
				platform: "linux",
				home: "/synthetic",
				read: missing,
			})
		).platform,
		"linux",
	);
	await assert.rejects(
		clientConfig({ ...mac, read: missing }),
		code("CONFIG_REQUIRED"),
	);
	for (const config of [
		{ sshHost: "-oProxyCommand=bad" },
		{ sshHost: "host;bad" },
		{ sshHost: "user@host" },
		{ sshHost: "a".repeat(129) },
		{ endpoint: "http://decoy" },
		[],
	]) {
		await assert.rejects(
			clientConfig({ ...mac, read: async () => JSON.stringify(config) }),
			code("INVALID_CONFIG"),
		);
	}
	assert.equal(
		(await clientConfig({ ...mac, read: async () => '{"sshHost":"homelab"}' }))
			.sshHost,
		"homelab",
	);
	const linux = requestCommand({ platform: "linux", home: "/synthetic" });
	assert.equal(linux.file, process.execPath);
	assert.deepEqual(linux.args, [
		"/synthetic/.local/share/pi-browser/current/cli.mjs",
	]);
	const remote = requestCommand(mac);
	assert.equal(remote.file, "ssh");
	assert.deepEqual(remote.args.slice(-2), ["homelab", REMOTE_COMMAND]);
	assert(remote.args.includes("BatchMode=yes"));
	assert(remote.args.includes("ClearAllForwardings=yes"));
	assert(!remote.args.some((arg) => arg.includes(connection.password)));
});

test("nonzero CLI exits still parse JSON; stderr and service messages are not exposed", async () => {
	const response = await runJSON(
		node(`process.stdin.resume(); process.stdin.on('end', () => {
    process.stderr.write('synthetic-private-stderr');
    process.stdout.write(JSON.stringify({ok:false,error:{code:'BROWSER_BUSY',message:'synthetic-private-message'}}));
    process.exitCode = 17;
  });`),
		encodeRequest({ action: "status", clientId: ID }),
	);
	assert.throws(() => unwrap(response), code("BROWSER_BUSY"));
	assert(
		!safeError(new Error(connection.password)).message.includes(
			connection.password,
		),
	);
	assert.equal(new BrowserError(connection.password).code, "SERVICE_ERROR");
	assert.throws(
		() =>
			unwrap({
				ok: false,
				error: { code: "UNKNOWN", message: connection.password },
			}),
		code("SERVICE_ERROR"),
	);
	assert.throws(
		() => unwrap({ ok: true, result: [] }),
		code("INVALID_RESPONSE"),
	);
	await assert.rejects(
		runJSON(node(`process.stdout.write('not JSON synthetic-private');`)),
		code("INVALID_RESPONSE"),
	);
	await assert.rejects(
		runJSON({ file: "/no/such/synthetic-executable", args: [] }),
		code("TRANSPORT_UNAVAILABLE"),
	);
});

test("response bytes, deadlines, and cancellation are bounded and kill only their request child", async () => {
	await assert.rejects(
		runJSON(node(`process.stdout.write('x'.repeat(${MAX_RESPONSE + 1}));`)),
		code("RESPONSE_TOO_LARGE"),
	);
	for (const cancellation of [false, true]) {
		const controller = new AbortController();
		let child;
		let exited;
		const spawnChild = (...args) => {
			child = spawn(...args);
			exited = new Promise((resolve) => child.once("exit", resolve));
			return child;
		};
		const pending = runJSON(node("setInterval(() => {}, 1000)"), "", {
			signal: controller.signal,
			timeoutMs: cancellation ? 10_000 : 40,
			spawnChild,
		});
		if (cancellation) controller.abort();
		await assert.rejects(pending, code(cancellation ? "CANCELLED" : "TIMEOUT"));
		await exited;
		assert.equal(child.signalCode, "SIGKILL");
	}
	let spawned = false;
	await assert.rejects(
		runJSON(node(""), "", {
			signal: AbortSignal.abort(),
			spawnChild: () => {
				spawned = true;
			},
		}),
		code("CANCELLED"),
	);
	assert.equal(spawned, false);
});

test("explicit connect is session-private; tool has no lifecycle or credential actions", async () => {
	const requests = [];
	const request = async (payload) => {
		requests.push(payload);
		if (payload.action === "screenshot")
			return {
				tab: `${ID}:1`,
				mimeType: "image/png",
				image: png,
				password: connection.password,
			};
		if (payload.action === "tabs")
			return {
				tabs: [{ id: `${ID}:1`, url: "about:blank", title: "" }],
				password: connection.password,
			};
		return { ...status, password: connection.password, port: 6080 };
	};
	const viewer = { stop: async () => {}, open: async () => {} };
	const session = createBrowserSession({ request, viewer });
	const other = createBrowserSession({ request, viewer });
	assert.equal(requests.length, 0);
	await session.tool({ action: "status" });
	for (const action of TOOL_ACTIONS.filter((action) => action !== "status")) {
		await assert.rejects(session.tool({ action }), code("LEASE_REQUIRED"));
	}
	await session.command("start");
	await assert.rejects(
		session.tool({ action: "tabs" }),
		code("LEASE_REQUIRED"),
	);
	await session.command("connect");
	const tabs = await session.tool({ action: "tabs" });
	assert(!JSON.stringify(tabs).includes(connection.password));
	const image = await session.tool({ action: "screenshot", tab: `${ID}:1` });
	assert.deepEqual(image.content, [
		{ type: "image", mimeType: "image/png", data: png },
	]);
	for (const action of [
		"connection",
		"claim",
		"release",
		"start",
		"stop",
		"eval",
		"cookies",
	]) {
		await assert.rejects(session.tool({ action }), code("INVALID_REQUEST"));
	}
	await assert.rejects(
		session.tool({ action: "status", clientId: OTHER }),
		code("INVALID_REQUEST"),
	);
	await assert.rejects(other.tool({ action: "tabs" }), code("LEASE_REQUIRED"));
	await other.tool({ action: "status" });
	assert.notEqual(requests[0].clientId, requests.at(-1).clientId);
	assert(
		requests
			.slice(0, -1)
			.every((request) => request.clientId === requests[0].clientId),
	);
	await session.shutdown();
	await other.shutdown();
});

test("handoff/releases, disconnect, reset, failed claims and shutdown preserve service ownership", async () => {
	const requests = [];
	let stops = 0;
	let rejectRelease = false;
	const session = createBrowserSession({
		viewer: {
			stop: async () => {
				stops++;
			},
		},
		request: async (payload) => {
			requests.push(payload);
			if (rejectRelease && payload.action === "release")
				throw new BrowserError("SERVICE_UNAVAILABLE");
			return status;
		},
	});
	await session.command("connect");
	await session.command("handoff");
	assert.equal(stops, 0);
	await assert.rejects(
		session.tool({ action: "tabs" }),
		code("LEASE_REQUIRED"),
	);
	await session.command("connect");
	rejectRelease = true;
	await assert.rejects(
		session.command("disconnect"),
		code("SERVICE_UNAVAILABLE"),
	);
	assert.equal(stops, 1);
	rejectRelease = false;
	await session.shutdown();
	await session.shutdown();
	assert.equal(requests.at(-1).action, "release");
	assert(!requests.some((request) => request.action === "stop"));
	session.reset();
	await assert.rejects(
		session.tool({ action: "tabs" }),
		code("LEASE_REQUIRED"),
	);
	let claimAttempts = 0;
	const failed = createBrowserSession({
		viewer: { stop: async () => {} },
		request: async ({ action }) => {
			claimAttempts++;
			if (action === "claim") throw new BrowserError("TIMEOUT");
			assert.equal(action, "release");
			return status;
		},
	});
	await assert.rejects(failed.command("connect"), code("TIMEOUT"));
	await failed.shutdown();
	assert.equal(claimAttempts, 2);
});

test("stopped and unavailable CLI status do not invent a controller mode", () => {
	assert.deepEqual(publicResult("stop", { state: "stopped" }), {
		state: "stopped",
	});
	assert.deepEqual(publicResult("status", { state: "unavailable" }), {
		state: "unavailable",
	});
	assert.throws(
		() => publicResult("status", { state: "ready" }),
		code("INVALID_RESPONSE"),
	);
	assert.deepEqual(
		publicResult("click", { tab: `${ID}:1`, completed: "click" }),
		{ tab: `${ID}:1`, completed: "click" },
	);
});

test("Linux view explains the Mac path without requesting credentials", async () => {
	const session = createBrowserSession({
		platform: "linux",
		request: async () => assert.fail("no service request"),
	});
	assert.match((await session.command("view")).message, /Mac Pi session/);
	await session.shutdown();
	assert.throws(
		() => publicResult("connection", connection),
		code("INVALID_REQUEST"),
	);
	assert.throws(
		() =>
			publicResult("screenshot", {
				tab: `${ID}:1`,
				mimeType: "image/jpeg",
				image: png,
			}),
		code("INVALID_RESPONSE"),
	);
});

test("credential script gates exact URL and visible form, does not echo or retain its password", () => {
	const url = "http://127.0.0.1:4567/vnc.html?autoconnect=1&resize=scale";
	const input = { value: "", getClientRects: () => [1] };
	let sent;
	let dialogOpen = false;
	const document = {
		getElementById: (id) => {
			if (id === "noVNC_password_input") return input;
			if (id === "noVNC_credentials_dlg")
				return { classList: { contains: () => dialogOpen } };
			return {
				click: () => {
					sent = input.value;
				},
			};
		},
	};
	const script = credentialsScript(url, connection.password);
	assert.equal(
		runInNewContext(script, {
			location: { href: "https://decoy.invalid/" },
			document,
		}),
		false,
	);
	assert.equal(sent, undefined);
	// noVNC's hidden/pre-init form can have layout rectangles before a real credential request.
	assert.equal(
		runInNewContext(script, { location: { href: url }, document }),
		false,
	);
	assert.equal(sent, undefined);
	dialogOpen = true;
	assert.equal(
		runInNewContext(script, { location: { href: url }, document }),
		true,
	);
	assert.equal(sent, connection.password);
	assert.equal(input.value, "");
	input.getClientRects = () => [];
	assert.equal(
		runInNewContext(script, { location: { href: url }, document }),
		false,
	);
});

test("native socket JSON RPC is addressed, bounded, and sanitizes failures", async () => {
	let written;
	const connect = ({ path }) => {
		assert.equal(path, "/synthetic/cmux.sock");
		const socket = new EventEmitter();
		socket.destroy = () => {};
		socket.write = (input) => {
			written = JSON.parse(input);
			const output = Buffer.from(
				JSON.stringify({ id: written.id, ok: true, result: { value: true } }) +
					"\n",
			);
			socket.emit("data", output.subarray(0, 5));
			socket.emit("data", output.subarray(5));
		};
		queueMicrotask(() => socket.emit("connect"));
		return socket;
	};
	assert.deepEqual(
		await nativeRPC(
			"/synthetic/cmux.sock",
			"browser.eval",
			{ workspace_id: ID, surface_id: OTHER, script: "true" },
			{ connect },
		),
		{ value: true },
	);
	assert.equal(written.params.workspace_id, ID);
	assert.equal(written.params.surface_id, OTHER);
	await assert.rejects(
		nativeRPC(
			"/synthetic/cmux.sock",
			"browser.eval",
			{},
			{
				connect: () => {
					throw new Error(connection.password);
				},
			},
		),
		code("VIEW_UNAVAILABLE"),
	);
});

test("viewer creates a local no-focus browser, sends secrets only over native socket, reuses and preserves panes", async () => {
	const cliCalls = [];
	const rpcCalls = [];
	let forwards = 0;
	let stopped = 0;
	let loss;
	let notices = 0;
	let repurposed = false;
	const viewer = createViewer({
		config: async () => mac,
		cli: async (spec) => {
			cliCalls.push(spec);
			return spec.args.includes("identify")
				? { app: "cmux", socket_path: "/synthetic/cmux.sock" }
				: { workspace_id: ID, surface_id: OTHER };
		},
		rpc: async (socket, method, params) => {
			assert.equal(socket, "/synthetic/cmux.sock");
			assert.equal(method, "browser.eval");
			assert.equal(params.workspace_id, ID);
			assert.equal(params.surface_id, OTHER);
			rpcCalls.push(params.script);
			return { value: !repurposed };
		},
		tunnel: async (_config, port, onLoss) => {
			assert.equal(port, 6080);
			forwards++;
			loss = onLoss;
			return {
				port: 4567,
				alive: () => true,
				stop: async () => {
					stopped++;
				},
			};
		},
	});
	await viewer.open(connection, () => notices++);
	const layout = JSON.parse(cliCalls[1].args.at(-1));
	assert.equal(layout.focus, false);
	assert.equal(layout.layout.pane.surfaces[0].type, "browser");
	assert.equal(
		layout.layout.pane.surfaces[0].url,
		"http://127.0.0.1:4567/vnc.html?autoconnect=1&resize=scale",
	);
	assert(!JSON.stringify(cliCalls).includes("synthetic-private"));
	assert(!rpcCalls[0].includes("synthetic-private"));
	assert(rpcCalls[1].includes("synthetic-private"));
	await viewer.open(connection, () => notices++);
	assert.equal(forwards, 1);
	loss();
	assert.equal(notices, 1);
	await viewer.open({ ...connection, generation: OTHER }, () => {});
	assert.equal(forwards, 2);
	assert.equal(stopped, 1);
	repurposed = true;
	await assert.rejects(
		viewer.open({ ...connection, generation: OTHER }, () => {}),
		code("VIEW_REPURPOSED"),
	);
	await viewer.stop();
	assert.equal(stopped, 2);
	assert(
		!cliCalls.some((call) =>
			call.args.some(
				(arg) => arg.includes("close") || arg.includes("select-workspace"),
			),
		),
	);
});

test("viewer tunnel binds only loopback viewer port, checks readiness, reports loss, and owns its child", async () => {
	let args;
	let child;
	let notices = 0;
	const spawnChild = (_file, arguments_) => {
		args = arguments_;
		child = new EventEmitter();
		child.exitCode = null;
		child.signalCode = null;
		child.kill = (signal) => {
			child.signalCode = signal;
			queueMicrotask(() => {
				child.emit("exit");
				child.emit("close");
			});
		};
		return child;
	};
	const tunnel = await viewerTunnel(mac, 6080, () => notices++, {
		spawnChild,
		allocate: async () => 4567,
		ready: async (port) => port === 4567,
	});
	assert(args.includes("ExitOnForwardFailure=yes"));
	assert.deepEqual(args.slice(-4), [
		"-N",
		"-L",
		"127.0.0.1:4567:127.0.0.1:6080",
		"homelab",
	]);
	assert(!args.includes(REMOTE_COMMAND));
	child.emit("exit");
	assert.equal(notices, 1);
	assert.equal(tunnel.alive(), false);
	await tunnel.stop();
	assert.equal(notices, 1);
	await assert.rejects(
		viewerTunnel(mac, 0, () => {}),
		code("VIEW_UNAVAILABLE"),
	);
});

test("tool cancellation propagates through session consent to the actual owned request child", async () => {
	let child;
	let exited;
	let started;
	const ready = new Promise((resolve) => {
		started = resolve;
	});
	const session = createBrowserSession({
		viewer: { stop: async () => {} },
		request: async (payload, { signal }) => {
			if (payload.action !== "tabs") return status;
			return unwrap(
				await runJSON(
					node("setInterval(() => {}, 1000)"),
					encodeRequest(payload),
					{
						signal,
						spawnChild: (...args) => {
							child = spawn(...args);
							exited = new Promise((resolve) => child.once("exit", resolve));
							started();
							return child;
						},
					},
				),
			);
		},
	});
	await session.command("connect");
	const cancellation = new AbortController();
	const pending = session.tool({ action: "tabs" }, cancellation.signal);
	await ready;
	cancellation.abort();
	await assert.rejects(pending, code("CANCELLED"));
	await exited;
	assert.equal(child.signalCode, "SIGKILL");
	await session.shutdown();
});

test("failed viewer creation stops only its tunnel and sanitizes native errors", async () => {
	let stopped = 0;
	const viewer = createViewer({
		config: async () => mac,
		cli: async (spec) => {
			if (spec.args.includes("identify"))
				return { app: "cmux", socket_path: "/synthetic/cmux.sock" };
			throw new Error(connection.password);
		},
		tunnel: async () => ({
			port: 4567,
			stop: async () => stopped++,
			alive: () => true,
		}),
	});
	await assert.rejects(
		viewer.open(connection, () => {}),
		code("VIEW_UNAVAILABLE"),
	);
	await viewer.stop();
	assert.equal(stopped, 1);
});

test("thin Pi wiring registers inertly, declares only public actions, confirms stop, and cleans up", async () => {
	// Fake only the host registration API. Transport and runtime state use the real implementation.
	const source = stripTypeScriptTypes(
		await readFile(
			new URL(
				"../pi/agent/extensions/shared-browser/index.ts",
				import.meta.url,
			),
			"utf8",
		),
	)
		.replace(/^import .*;\n/gm, "")
		.replace(
			"export default function sharedBrowser",
			"globalThis.extension = function sharedBrowser",
		);
	const calls = [];
	const events = {};
	const Type = Object.fromEntries(
		["Object", "String", "Optional", "Union", "Literal"].map((kind) => [
			kind,
			(...args) => ({ kind, args }),
		]),
	);
	const scope = {
		Type,
		TOOL_ACTIONS,
		safeError,
		createBrowserSession: () =>
			createBrowserSession({
				request: async (request) => {
					calls.push(request);
					return status;
				},
				viewer: { stop: async () => {} },
			}),
	};
	runInNewContext(source, scope);
	let tool;
	let command;
	scope.extension({
		registerTool: (value) => {
			tool = value;
		},
		registerCommand: (name, value) => {
			assert.equal(name, "browser");
			command = value;
		},
		on: (name, handler) => {
			events[name] = handler;
		},
	});
	assert.equal(calls.length, 0);
	assert.equal(tool.name, "shared_browser");
	const params = tool.parameters.args[0];
	assert.deepEqual(Object.keys(params), [
		"action",
		"tab",
		"selector",
		"text",
		"url",
	]);
	assert.deepEqual(
		Array.from(params.action.args[0], (schema) => schema.args[0]),
		TOOL_ACTIONS,
	);
	assert.equal(tool.parameters.args[1].additionalProperties, false);
	const notices = [];
	const ctx = {
		hasUI: true,
		ui: {
			confirm: async () => false,
			notify: (message) => notices.push(message),
		},
	};
	await command.handler("stop", ctx);
	assert.equal(calls.length, 0);
	await command.handler("connect", ctx);
	await tool.execute("synthetic-call", { action: "status" });
	await events.session_shutdown();
	events.session_start();
	await assert.rejects(
		tool.execute("synthetic-call", { action: "tabs" }),
		code("LEASE_REQUIRED"),
	);
	assert.deepEqual(
		calls.map((call) => call.action),
		["claim", "status", "release"],
	);
	assert(!JSON.stringify(notices).includes(connection.password));
});
