import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

test("dependency validation rejects missing/non-executable binaries and failed/unresolved ldd", (t) => {
	const home = mkdtempSync(join(tmpdir(), "browser-dependencies-"));
	t.after(() => rmSync(home, { recursive: true, force: true }));
	const root = join(home, "dependencies");
	const bin = join(home, "bin");
	const put = (path, body, mode = 0o700) => {
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, body, { mode });
	};
	mkdirSync(join(root, "debs"), { recursive: true });
	// Isolate external inspections; only the production shell validator executes.
	for (const path of [join(home, ".local/bin/node"), join(bin, "sha256sum"), join(bin, "python3")])
		put(path, "#!/bin/sh\nexit 0\n");
	put(join(bin, "ldd"), `#!/bin/sh
case "$LDD_CASE" in
  failure) echo 'inspection failed' >&2; exit 1 ;;
  unresolved) echo 'libfixture.so => not found' ;;
  valid) echo 'libfixture.so => /fixture/libfixture.so' ;;
esac
`);
	const helper = fileURLToPath(new URL("../scripts/browser-service/dependencies.sh", import.meta.url));
	for (const scenario of ["missing-Xvfb", "missing-x11vnc", "non-executable", "failure", "unresolved", "valid"]) {
		for (const name of ["Xvfb", "x11vnc"]) {
			const path = join(root, "sysroot/usr/bin", name);
			rmSync(path, { force: true });
			if (scenario !== `missing-${name}`)
				put(path, "#!/bin/sh\nexit 0\n", scenario === "non-executable" ? 0o600 : 0o700);
		}
		const result = spawnSync("/bin/bash", ["-c", 'source "$1"; check_dependencies "$2"', "check", helper, root], {
			env: { HOME: home, PATH: bin, LDD_CASE: scenario },
			encoding: "utf8",
			timeout: 2000,
		});
		assert.ifError(result.error);
		if (scenario === "valid") assert.equal(result.status, 0, result.stderr);
		else {
			assert.notEqual(result.status, 0, scenario);
			assert.match(result.stderr, /Missing executable|Cannot inspect|Unresolved libraries/, scenario);
		}
	}
});

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
