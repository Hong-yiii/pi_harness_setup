import assert from "node:assert/strict";

export const MAX_REQUEST = 32 * 1024;
export const MAX_RESPONSE = 8 * 1024 * 1024;
export const LEASE_MS = 15 * 60 * 1000;
const actions = new Set([
	"status",
	"claim",
	"release",
	"connection",
	"tabs",
	"open",
	"navigate",
	"snapshot",
	"click",
	"fill",
	"press",
	"screenshot",
	"close",
]);
const fields = new Set([
	"action",
	"clientId",
	"tab",
	"selector",
	"text",
	"url",
]);

export function fault(code) {
	return Object.assign(new Error(code), { code });
}

export function validate(request) {
	if (
		!request ||
		typeof request !== "object" ||
		Array.isArray(request) ||
		Object.keys(request).some((key) => !fields.has(key)) ||
		!actions.has(request.action)
	)
		throw fault("INVALID_REQUEST");
	for (const key of ["clientId", "tab", "selector", "text", "url"]) {
		if (
			request[key] !== undefined &&
			(typeof request[key] !== "string" || request[key].length > 16000)
		)
			throw fault("INVALID_REQUEST");
	}
	if (
		request.action !== "status" &&
		!/^[a-f0-9-]{36}$/i.test(request.clientId ?? "")
	)
		throw fault("INVALID_REQUEST");
	if (
		[
			"navigate",
			"snapshot",
			"click",
			"fill",
			"press",
			"screenshot",
			"close",
		].includes(request.action) &&
		!request.tab
	)
		throw fault("INVALID_REQUEST");
	if (["click", "fill"].includes(request.action) && !request.selector)
		throw fault("INVALID_REQUEST");
	if (["fill", "press"].includes(request.action) && request.text === undefined)
		throw fault("INVALID_REQUEST");
	if (request.action === "navigate" && !request.url)
		throw fault("INVALID_REQUEST");
	if (request.url !== undefined) {
		const url = URL.parse(request.url);
		if (
			!url ||
			!["http:", "https:"].includes(url.protocol) ||
			url.username ||
			url.password
		)
			throw fault("INVALID_REQUEST");
	}
	return request;
}

export function createRouter(
	browser,
	{ generation, port, password, now = Date.now },
) {
	let owner;
	let expires = 0;
	let serial = 0;
	const pages = new Map();
	function refresh() {
		const context = browser.contexts()[0];
		if (!context) throw fault("BROWSER_UNAVAILABLE");
		for (const [id, page] of pages) if (page.isClosed()) pages.delete(id);
		for (const page of context.pages())
			if (![...pages.values()].includes(page))
				pages.set(`${generation}:${++serial}`, page);
		return context;
	}
	function status() {
		if (now() >= expires) owner = undefined;
		return {
			state: "ready",
			mode: owner ? "automation" : "human",
			generation,
			leaseExpiresAt: owner ? new Date(expires).toISOString() : null,
		};
	}
	function requireOwner(clientId) {
		status();
		if (owner !== clientId) throw fault("LEASE_REQUIRED");
		expires = now() + LEASE_MS;
	}
	return async (input) => {
		const request = validate(input);
		const { action, clientId, tab, selector, text, url } = request;
		const current = status();
		if (action === "status") return current;
		if (action === "connection") return { port, password, generation }; // Human-command transport only, never a model tool result.
		if (action === "claim") {
			if (owner && owner !== clientId) throw fault("BROWSER_BUSY");
			owner = clientId;
			expires = now() + LEASE_MS;
			return status();
		}
		if (action === "release") {
			if (owner && owner !== clientId) throw fault("BROWSER_BUSY");
			owner = undefined;
			return status();
		}
		requireOwner(clientId);
		const context = refresh();
		if (action === "tabs") {
			return {
				tabs: await Promise.all(
					[...pages].map(async ([id, page]) => ({
						id,
						url: page.url(),
						title: (await page.title()).slice(0, 500),
					})),
				),
			};
		}
		if (action === "open") {
			const page = await context.newPage();
			try {
				if (url)
					await page.goto(url, {
						timeout: 15000,
						waitUntil: "domcontentloaded",
					});
				refresh();
				return {
					tab: [...pages].find(([, value]) => value === page)[0],
					url: page.url(),
				};
			} catch (error) {
				await page.close().catch(() => {});
				throw error;
			}
		}
		const page = pages.get(tab);
		if (!page || page.isClosed()) throw fault("TAB_NOT_FOUND");
		page.setDefaultTimeout(10000);
		switch (action) {
			case "navigate":
				await page.goto(url, { timeout: 15000, waitUntil: "domcontentloaded" });
				return { tab, url: page.url() };
			case "snapshot":
				return {
					tab,
					text: (
						await page.locator("body").ariaSnapshot({ timeout: 10000 })
					).slice(0, 24000),
				};
			case "click":
				await page.locator(selector).click();
				break;
			case "fill":
				await page.locator(selector).fill(text);
				break;
			case "press":
				if (selector) await page.locator(selector).press(text);
				else await page.keyboard.press(text);
				break;
			case "screenshot": {
				const png = await page.screenshot({ type: "png", timeout: 10000 });
				if (png.length > 4 * 1024 * 1024) throw fault("RESPONSE_TOO_LARGE");
				return { tab, mimeType: "image/png", image: png.toString("base64") };
			}
			case "close":
				if (context.pages().length <= 1) throw fault("LAST_TAB");
				await page.close();
				pages.delete(tab);
				break;
			default:
				throw fault("INVALID_REQUEST");
		}
		return { tab, completed: action };
	};
}

export function assertLoopback(output, ports) {
	assert.ok(
		ports.every((port) => Number.isInteger(port) && port > 0 && port < 65536),
	);
	const addresses = output
		.trim()
		.split("\n")
		.map((line) => line.trim().split(/\s+/)[3])
		.sort();
	assert.deepEqual(
		addresses,
		ports.map((port) => `127.0.0.1:${port}`).sort(),
		"Missing or non-loopback browser listener",
	);
}

export function failure(error) {
	const allowed = new Set([
		"INVALID_REQUEST",
		"BROWSER_UNAVAILABLE",
		"SERVICE_UNAVAILABLE",
		"BROWSER_BUSY",
		"LEASE_REQUIRED",
		"TAB_NOT_FOUND",
		"LAST_TAB",
		"RESPONSE_TOO_LARGE",
	]);
	const code = allowed.has(error?.code) ? error.code : "ACTION_FAILED";
	return { ok: false, error: { code, message: code } }; // Never return Playwright errors containing page text or endpoints.
}
