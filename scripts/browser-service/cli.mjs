// Private stdio bridge: no arbitrary host/endpoint, shell interpolation or browser credentials in argv.
import { execFile } from "node:child_process";
import { createConnection } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import {
	MAX_REQUEST,
	MAX_RESPONSE,
	failure,
	fault,
	validate,
} from "./protocol.mjs";

const exec = promisify(execFile);
const socketPath = join(homedir(), ".local/state/pi-browser/control.sock");

function rpc(request) {
	return new Promise((resolve, reject) => {
		const socket = createConnection(socketPath);
		let output = "";
		socket.setEncoding("utf8");
		socket.setTimeout(35000, () =>
			socket.destroy(new Error("Request timeout")),
		);
		socket.once("error", () => reject(fault("SERVICE_UNAVAILABLE")));
		socket.once("connect", () => socket.write(`${JSON.stringify(request)}\n`));
		socket.on("data", (chunk) => {
			output += chunk;
			if (Buffer.byteLength(output) > MAX_RESPONSE)
				socket.destroy(new Error("Oversized response"));
		});
		socket.once("end", () => {
			try {
				resolve(JSON.parse(output));
			} catch {
				reject(fault("SERVICE_UNAVAILABLE"));
			}
		});
	});
}

async function main() {
	let input = "";
	for await (const chunk of process.stdin) {
		input += chunk;
		if (Buffer.byteLength(input) > MAX_REQUEST) throw fault("INVALID_REQUEST");
	}
	let request;
	try {
		request = JSON.parse(input);
	} catch {
		throw fault("INVALID_REQUEST");
	}
	if (request?.action === "start" || request?.action === "stop") {
		if (
			Object.keys(request).some((key) => !["action", "clientId"].includes(key))
		)
			throw fault("INVALID_REQUEST");
		try {
			await exec(
				"/usr/bin/systemctl",
				["--user", request.action, "pi-browser.service"],
				{ timeout: 35000, maxBuffer: 4096 },
			);
		} catch {
			throw fault("SERVICE_UNAVAILABLE");
		}
		if (request.action === "stop")
			return { ok: true, result: { state: "stopped" } };
		for (let attempt = 0; attempt < 400; attempt++) {
			try {
				return await rpc({ action: "status" });
			} catch {
				if (attempt % 10 === 0) {
					const { stdout } = await exec(
						"/usr/bin/systemctl",
						[
							"--user",
							"show",
							"pi-browser.service",
							"--property=ActiveState",
							"--value",
						],
						{ timeout: 2000 },
					);
					if (["failed", "inactive"].includes(stdout.trim()))
						throw fault("SERVICE_UNAVAILABLE");
				}
				await delay(100);
			}
		}
		throw fault("SERVICE_UNAVAILABLE");
	}
	validate(request);
	try {
		return await rpc(request);
	} catch (error) {
		if (request.action !== "status") throw error;
		let state = "unavailable";
		try {
			const { stdout } = await exec(
				"/usr/bin/systemctl",
				[
					"--user",
					"show",
					"pi-browser.service",
					"--property=ActiveState",
					"--value",
				],
				{ timeout: 5000 },
			);
			if (stdout.trim() === "inactive") state = "stopped";
		} catch {
			/* Unknown is unavailable, not permission to start another browser. */
		}
		return { ok: true, result: { state } };
	}
}

try {
	const result = await main();
	process.stdout.write(`${JSON.stringify(result)}\n`);
	if (!result.ok) process.exitCode = 1;
} catch (error) {
	process.stdout.write(`${JSON.stringify(failure(error))}\n`);
	process.exitCode = 1;
}
