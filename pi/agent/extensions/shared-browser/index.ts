import { Type, type Static } from "@earendil-works/pi-ai";
import type {
	AgentToolResult,
	ExtensionAPI,
	ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { TOOL_ACTIONS, createBrowserSession, safeError } from "./transport.mjs";

export default function sharedBrowser(pi: ExtensionAPI) {
	// Registration is inert: no config reads, children, sockets, or timers until explicit use.
	const session = createBrowserSession();
	let live = true;
	const parameters = Type.Object(
		{
			action: Type.Union(
				TOOL_ACTIONS.map((action: string) => Type.Literal(action)),
			),
			tab: Type.Optional(
				Type.String({
					description: "Explicit service tab ID, including generation",
				}),
			),
			selector: Type.Optional(Type.String()),
			text: Type.Optional(Type.String()),
			url: Type.Optional(Type.String()),
		},
		{ additionalProperties: false },
	);
	pi.registerTool({
		name: "shared_browser",
		label: "Shared Linux browser",
		description:
			"Control shared Linux Chrome (remote from Mac, even in a local noVNC viewer). Use only for a user-requested Linux/shared target or identified shared-browser tab; default unspecified local Mac page-opening requests to the cmux-browser skill instead. If ambiguous, ask before acting; never silently switch browsers. A connection lease is not a target preference. Except status, requires /browser connect in this Pi session. Use explicit tab IDs from tabs/open. Lifecycle and viewer access are user commands only.",
		parameters,
		async execute(
			_id: string,
			params: Static<typeof parameters>,
			signal: AbortSignal | undefined,
		) {
			try {
				return (await session.tool(
					params,
					signal,
				)) as AgentToolResult<undefined>;
			} catch (error) {
				throw safeError(error);
			}
		},
	});

	pi.registerCommand("browser", {
		description:
			"Linux browser (remote from Mac): start | status | connect | handoff | disconnect | view | stop",
		handler: async (args: string, ctx: ExtensionCommandContext) => {
			const action = args.trim() || "status";
			if (
				![
					"start",
					"status",
					"connect",
					"handoff",
					"release",
					"disconnect",
					"view",
					"stop",
				].includes(action)
			) {
				ctx.ui.notify(
					"Linux browser (remote from Mac). Usage: /browser start|status|connect|handoff|disconnect|view|stop",
					"info",
				);
				return;
			}
			if (
				action === "stop" &&
				ctx.hasUI &&
				!(await ctx.ui.confirm(
					"Stop shared Linux browser?",
					"This stops the service-owned Linux Chrome for everyone, not native Mac browser panes.",
				))
			)
				return;
			try {
				const result = await session.command(action, () => {
					if (live && ctx.hasUI)
						ctx.ui.notify(
							"Shared browser viewer tunnel disconnected. Use /browser view to reconnect; the Linux browser was not stopped.",
							"warning",
						);
				});
				ctx.ui.notify(JSON.stringify(result), "info");
			} catch (error) {
				ctx.ui.notify(safeError(error).message, "error");
			}
		},
	});
	pi.on("session_start", () => {
		live = true;
		session.reset();
	});
	pi.on("session_shutdown", async () => {
		live = false;
		await session.shutdown();
	});
}
