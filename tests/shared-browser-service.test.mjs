import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
	LEASE_MS,
	assertLoopback,
	createRouter,
	failure,
	validate,
} from "../scripts/browser-service/protocol.mjs";

function fixture() {
	let closed = false,
		value = "";
	const page = {
		isClosed: () => closed,
		url: () => "http://127.0.0.1/example",
		title: async () => "Fixture",
		setDefaultTimeout() {},
		goto: async () => {},
		close: async () => {
			closed = true;
		},
		locator: () => ({
			fill: async (text) => {
				value = text;
			},
			click: async () => {},
			ariaSnapshot: async () => value,
			press: async () => {},
		}),
		keyboard: { press: async () => {} },
		screenshot: async () => Buffer.from("png fixture"),
	};
	const context = {
		pages: () => (closed ? [] : [page]),
		newPage: async () => page,
	};
	const browser = { contexts: () => [context] };
	let clock = 1;
	const route = createRouter(browser, {
		generation: randomUUID(),
		port: 1234,
		password: "private!",
		now: () => clock,
	});
	return {
		route,
		advance: () => {
			clock += LEASE_MS + 1;
		},
	};
}

const clientId = randomUUID();
test("request validation rejects unsafe protocols, ambiguity and unknown operations", () => {
	for (const request of [
		null,
		[],
		{ action: "eval", clientId, text: "process.exit()" },
		{ action: "navigate", clientId, tab: "x", url: "file:///etc/passwd" },
		{ action: "open", clientId, url: "javascript:alert(1)" },
		{ action: "open", clientId, url: "http://user:password@localhost/" },
		{ action: "click", clientId, selector: "button" },
		{ action: "fill", clientId, tab: "x", selector: "input" },
		{ action: "status", endpoint: "ws://attacker" },
		{ action: "tabs", clientId: "not-a-uuid" },
	])
		assert.throws(() => validate(request), { code: "INVALID_REQUEST" });
	assert.equal(
		validate({ action: "open", clientId, url: "https://example.com" }).action,
		"open",
	);
});

test("explicit single-controller lease, handoff, expiry and same-page attachment", async () => {
	const { route, advance } = fixture();
	const other = randomUUID();
	assert.equal((await route({ action: "status" })).mode, "human");
	await assert.rejects(route({ action: "tabs", clientId }), {
		code: "LEASE_REQUIRED",
	});
	await route({ action: "claim", clientId });
	await assert.rejects(route({ action: "claim", clientId: other }), {
		code: "BROWSER_BUSY",
	});
	const tab = (await route({ action: "tabs", clientId })).tabs[0].id;
	await route({
		action: "fill",
		clientId,
		tab,
		selector: "input",
		text: "original-page",
	});
	await route({ action: "release", clientId });
	await assert.rejects(
		route({ action: "click", clientId, tab, selector: "button" }),
		{ code: "LEASE_REQUIRED" },
	);
	await route({ action: "claim", clientId: other });
	assert.equal(
		(await route({ action: "snapshot", clientId: other, tab })).text,
		"original-page",
	);
	advance();
	await assert.rejects(route({ action: "snapshot", clientId: other, tab }), {
		code: "LEASE_REQUIRED",
	});
	await route({ action: "claim", clientId });
	await assert.rejects(
		route({ action: "snapshot", clientId, tab: "old-generation:1" }),
		{ code: "TAB_NOT_FOUND" },
	);
	await assert.rejects(route({ action: "close", clientId, tab }), {
		code: "LAST_TAB",
	});
});

test("secrets are isolated from status, and browser errors are sanitized", async () => {
	const { route } = fixture();
	assert.ok(
		!JSON.stringify(await route({ action: "status" })).includes("private!"),
	);
	assert.equal(
		(await route({ action: "connection", clientId })).password,
		"private!",
	);
	assert.deepEqual(
		failure(new Error("secret cookie and ws://private endpoint")),
		{
			ok: false,
			error: { code: "ACTION_FAILED", message: "ACTION_FAILED" },
		},
	);
});

test("listener gate rejects the actual trial IPv6 wildcard regression and missing listeners", () => {
	const line = (port) => `LISTEN 0 32 127.0.0.1:${port} 0.0.0.0:*`;
	const safe = [1234, 1235, 1236].map(line).join("\n");
	assert.doesNotThrow(() => assertLoopback(safe, [1234, 1235, 1236]));
	assert.throws(() =>
		assertLoopback(`${safe}\nLISTEN 0 32 [::]:1234 [::]:*`, [1234, 1235, 1236]),
	);
	assert.throws(() => assertLoopback(line(1234), [1234, 1235, 1236]));
});
