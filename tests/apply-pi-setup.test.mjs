import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
	mkdtempSync,
	mkdirSync,
	writeFileSync,
	readFileSync,
	existsSync,
	rmSync,
	symlinkSync,
	readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const profile = JSON.parse(
	readFileSync(join(root, "pi/package-profiles/lean-default.json")),
);
const script = join(root, "scripts/apply-pi-setup.mjs");
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
function put(path, value) {
	mkdirSync(resolve(path, ".."), { recursive: true });
	writeFileSync(
		path,
		typeof value === "string" ? value : JSON.stringify(value),
	);
}
function fixture(t, version = "1.2.0") {
	const home = mkdtempSync(join(tmpdir(), "harness-apply-test-"));
	t.after(() => rmSync(home, { recursive: true, force: true }));
	const agent = join(home, ".pi/agent");
	const host = join(home, "runtime");
	const cli = join(host, "dist/cli.js");
	put(join(host, "package.json"), {
		name: "@earendil-works/pi-coding-agent",
		version,
	});
	put(
		cli,
		`#!/bin/sh\nif [ "$1" = --version ]; then echo ${version}; else echo 'unexpected installer' >&2; exit 91; fi\n`,
	);
	execFileSync("chmod", ["700", cli]);
	mkdirSync(join(home, "bin"));
	symlinkSync(cli, join(home, "bin/pi"));
	mkdirSync(join(host, "examples/extensions/plan-mode"), { recursive: true });
	for (const entry of profile.packages) {
		const [, name, pin] = /^npm:(.+)@([^@]+)$/.exec(entry.source);
		put(join(agent, "npm/node_modules", name, "package.json"), {
			name,
			version: pin,
		});
	}
	const env = {
		...process.env,
		HOME: home,
		PATH: `${home}/bin:${process.env.PATH}`,
	};
	delete env.PI_CODING_AGENT_DIR;
	const run = (...args) =>
		spawnSync(process.execPath, [script, ...args], {
			env,
			encoding: "utf8",
			cwd: root,
		});
	return { home, agent, run };
}

test("Mac/Linux managed settings converge; host-local choices survive; check is read-only and repeat apply is a no-op", (t) => {
	const states = [];
	for (const theme of ["dark", "neon-sakura"]) {
		const { home, agent, run } = fixture(t);
		put(join(agent, "settings.json"), {
			theme,
			defaultModel: "keep-my-model",
			unrelated: { keep: true },
			subagents: { defaultModel: "old-model", custom: true },
			packages: ["npm:pi-open-tui", "npm:pi-btw", "npm:unrelated@1.0.0"],
			skills: [],
		});
		put(join(agent, "extensions/subagent/config.json"), {
			parallel: { concurrency: 4, other: 1 },
			custom: true,
		});
		put(join(agent, "open-tui.json"), {
			enabled: false,
			icons: { mode: "unicode" },
		});
		put(join(home, ".agents/skills/teach/local-note.txt"), "keep");
		const before = readFileSync(join(agent, "settings.json"));
		const check = run("--check");
		assert.notEqual(check.status, 0);
		assert.deepEqual(readFileSync(join(agent, "settings.json")), before);
		assert.equal(
			existsSync(join(home, ".config/pi_harness_setup/backups")),
			false,
		);
		const apply = run();
		assert.equal(apply.status, 0, apply.stdout + apply.stderr);
		const settings = json(join(agent, "settings.json"));
		assert.equal(settings.theme, "neon-sakura");
		assert.equal(settings.defaultModel, "keep-my-model");
		assert.deepEqual(settings.unrelated, { keep: true });
		assert.equal(settings.subagents.custom, true);
		assert.equal(settings.subagents.defaultModel, "openai-codex/gpt-6.1-sol");
		const packages = settings.packages;
		assert.ok(packages.includes("npm:unrelated@1.0.0"));
		assert.deepEqual(
			packages.find((p) => p.source?.includes("pi-observability")).extensions,
			[],
		);
		const btw = packages.find((p) => (p.source ?? p).includes("pi-btw"));
		assert.ok(btw && (!btw.skills || btw.skills.length > 0));
		assert.deepEqual(json(join(agent, "extensions/subagent/config.json")), {
			parallel: { concurrency: 12, maxTasks: 50, other: 1 },
			custom: true,
		});
		assert.deepEqual(json(join(agent, "open-tui.json")), {
			enabled: true,
			icons: { mode: "unicode" },
		});
		assert.equal(
			readFileSync(join(home, ".agents/skills/teach/local-note.txt"), "utf8"),
			"keep",
		);
		assert.equal(existsSync(join(agent, "AGENTS.md")), true);
		const backups = join(home, ".config/pi_harness_setup/backups");
		const backupCount = readdirSync(backups).length;
		assert.equal(run().status, 0);
		assert.equal(run("--assets-only").status, 0);
		assert.equal(readdirSync(backups).length, backupCount);
		const after = run("--check");
		assert.equal(after.status, 0, after.stdout + after.stderr);
		states.push(settings);
	}
	assert.deepEqual(states[0], states[1]);
});

test("JSON formatting and key order do not cause drift or rewrite live settings", (t) => {
	const { home, agent, run } = fixture(t);
	assert.equal(run().status, 0);
	const paths = ["settings.json", "open-tui.json", "extensions/subagent/config.json"];
	const snapshots = paths.map((path) => {
		const target = join(agent, path);
		const value = Object.fromEntries(Object.entries(json(target)).reverse());
		const bytes = JSON.stringify(value, null, "\t");
		writeFileSync(target, bytes);
		return [target, bytes];
	});
	const backups = join(home, ".config/pi_harness_setup/backups");
	const before = readdirSync(backups);
	for (const args of [["--check"], [], ["--assets-only"]]) {
		const result = run(...args);
		assert.equal(result.status, 0, result.stdout + result.stderr);
		for (const [path, bytes] of snapshots) assert.equal(readFileSync(path, "utf8"), bytes);
		assert.deepEqual(readdirSync(backups), before);
	}
});

test("wrong runtime, missing package and symlink destinations fail before writes", (t) => {
	for (const failure of ["runtime", "package", "symlink"]) {
		const { home, agent, run } = fixture(
			t,
			failure === "runtime" ? "0.83.0" : "1.2.0",
		);
		const settings = join(agent, "settings.json");
		put(settings, { theme: "original" });
		if (failure === "package")
			rmSync(join(agent, "npm/node_modules/pi-btw"), {
				recursive: true,
				force: true,
			});
		if (failure === "symlink") {
			put(join(home, "outside.json"), { enabled: false });
			symlinkSync(join(home, "outside.json"), join(agent, "open-tui.json"));
		}
		const result = run("--assets-only");
		assert.notEqual(result.status, 0, failure);
		assert.deepEqual(json(settings), { theme: "original" });
		assert.equal(
			existsSync(join(home, ".config/pi_harness_setup/backups")),
			false,
		);
	}
});

test("default apply rejects plan-mode/bin conflicts and settings symlinks before installers or writes", (t) => {
	for (const conflict of ["plan", "bin", "settings"]) {
		const { home, agent, run } = fixture(t);
		const settings = join(agent, "settings.json");
		put(settings, { theme: "original" });
		rmSync(join(agent, "npm/node_modules/pi-btw"), { recursive: true });
		if (conflict === "plan")
			mkdirSync(join(agent, "extensions/plan-mode"), { recursive: true });
		if (conflict === "bin")
			put(join(agent, "npm/node_modules/.bin/pi-lens"), "unmanaged");
		if (conflict === "settings") {
			rmSync(settings);
			put(join(home, "do-not-read"), "INVALID JSON SENTINEL");
			symlinkSync(join(home, "do-not-read"), settings);
		}
		const result = run();
		assert.notEqual(result.status, 0);
		assert.ok(!result.stderr.includes("unexpected installer"));
		if (conflict === "settings") {
			assert.match(result.stderr, /Review symlink/);
			assert.ok(!result.stderr.includes("Cannot parse"));
		} else assert.deepEqual(json(settings), { theme: "original" });
		assert.equal(
			existsSync(join(home, ".config/pi_harness_setup/backups")),
			false,
		);
	}
});

test("check detects restored shadow libraries and stale host links even with matching package versions", (t) => {
	const { agent, run } = fixture(t);
	assert.equal(run().status, 0);
	put(join(agent, "npm/node_modules/typebox/package.json"), {
		name: "typebox",
		version: "1.0.0",
	});
	const plan = join(agent, "extensions/plan-mode");
	rmSync(plan);
	symlinkSync("/not-the-selected-runtime", plan);
	const check = run("--check");
	assert.equal(check.status, 1, check.stdout + check.stderr);
	assert.match(check.stdout, /shadow: typebox/);
	assert.match(check.stdout, /plan-mode/);
	const repair = run();
	assert.equal(repair.status, 0, repair.stdout + repair.stderr);
	assert.equal(run("--check").status, 0);
});

test("installer failure keeps a full npm snapshot and original settings recovery point", (t) => {
	const { home, agent, run } = fixture(t);
	const settings = join(agent, "settings.json");
	put(settings, { theme: "before-failure" });
	rmSync(join(agent, "npm/node_modules/pi-btw"), { recursive: true });
	const result = run();
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /unexpected installer/);
	const backups = join(home, ".config/pi_harness_setup/backups");
	const backup = join(backups, readdirSync(backups)[0]);
	assert.equal(json(join(backup, "receipt.json")).status, "failed");
	assert.deepEqual(json(join(backup, "files/.pi/agent/settings.json")), {
		theme: "before-failure",
	});
	assert.ok(existsSync(join(backup, "npm/node_modules/pi-lens/package.json")));
	assert.deepEqual(json(settings), { theme: "before-failure" });
});

test("fresh install failure after one success records original absence, not a fictional snapshot", (t) => {
	const { home, agent, run } = fixture(t);
	rmSync(join(agent, "npm"), { recursive: true });
	put(
		join(home, "runtime/dist/cli.js"),
		`#!/bin/sh
if [ "$1" = --version ]; then echo 1.2.0; exit 0; fi
if [ ! -e "$HOME/installed-once" ]; then
  mkdir -p "$HOME/.pi/agent/npm/node_modules/pi-observability"
  printf '%s' '{"name":"pi-observability","version":"1.3.2"}' > "$HOME/.pi/agent/npm/node_modules/pi-observability/package.json"
  printf '%s' '{"packages":["npm:pi-observability@1.3.2"]}' > "$HOME/.pi/agent/settings.json"
  touch "$HOME/installed-once"
  exit 0
fi
echo 'second native-install failure' >&2
exit 91
`,
	);
	const result = run();
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /second native-install failure/);
	const backups = join(home, ".config/pi_harness_setup/backups");
	const backup = join(backups, readdirSync(backups)[0]);
	const receipt = json(join(backup, "receipt.json"));
	assert.equal(receipt.status, "failed");
	assert.equal(receipt.npmSnapshot, false);
	assert.equal(receipt.npmOriginallyAbsent, true);
	assert.equal(
		receipt.files.find((file) => file.path === ".pi/agent/settings.json")
			.before,
		null,
	);
	assert.equal(existsSync(join(backup, "npm")), false);
	assert.equal(
		json(join(agent, "npm/node_modules/pi-observability/package.json")).version,
		"1.3.2",
	);
});

test("Ubuntu bootstrap refuses a runtime downgrade", {
	skip: process.platform !== "linux",
}, (t) => {
	const bootstrap = readFileSync(
		join(root, "scripts/bootstrap-ubuntu-homelab.sh"),
		"utf8",
	);
	const guard = bootstrap
		.split("# Refuse an accidental downgrade")[1]
		.split("# Retain old runtimes:")[0];
	const body = guard.slice(guard.indexOf("\n"));
	for (const version of ["1.0.4", "1.2.0", "1.3.0"]) {
		const { home } = fixture(t, version);
		const result = spawnSync(
			"bash",
			["-c", 'set -eu; die() { echo "$*" >&2; exit 1; };\n' + body],
			{
				encoding: "utf8",
				env: {
					...process.env,
					LOCAL_BIN: join(home, "bin"),
					PI_VERSION: "1.2.0",
				},
			},
		);
		assert.equal(result.status, version === "1.3.0" ? 1 : 0, result.stderr);
	}
});
