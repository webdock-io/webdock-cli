import { colors } from "@cliffy/ansi/colors";
import { Select } from "@cliffy/prompt";
import type { Webdock } from "@webdock/sdk";
import { goBackOption, isGoBack } from "./navigation.ts";

export type InteractiveScriptSource = "ACCOUNT" | "WEBDOCK";

export type InteractiveScript = {
	id: number;
	slug: string;
	name: string;
	description: string;
	source: InteractiveScriptSource;
};

export async function promptForScriptSelection(
	client: Webdock,
	{
		sourceMessage = "Choose a script source:",
		scriptMessage = "Choose a script:",
		noneLabel = "No, continue without a script",
		includeNone = true,
		includeGoBack = false,
	}: {
		sourceMessage?: string;
		scriptMessage?: string;
		noneLabel?: string;
		includeNone?: boolean;
		includeGoBack?: boolean;
	} = {},
): Promise<InteractiveScript | null | "GO_BACK"> {
	while (true) {
		const sourceOptions = [
			...(includeNone ? [{ name: noneLabel, value: "NONE" }] : []),
			{ name: "Use one of my account scripts", value: "ACCOUNT" },
			{ name: "Use one of Webdock's library scripts", value: "WEBDOCK" },
			...(includeGoBack ? [goBackOption] : []),
		];

		const source = await Select.prompt({
			message: sourceMessage,
			options: sourceOptions,
		});

		if (includeGoBack && isGoBack(source)) {
			return "GO_BACK";
		}

		if (source === "NONE") {
			return null;
		}

		const scripts = await listScriptsBySource(client, source as InteractiveScriptSource);

		if (scripts.length === 0) {
			console.log(
				colors.yellow(
					source === "ACCOUNT" ? "No account scripts found for this action." : "No Webdock library scripts found for this action.",
				),
			);
			continue;
		}

		const scriptsById = new Map<string, InteractiveScript>(
			scripts.map((script) => [String(script.id), script]),
		);

		const selectedScriptId = await Select.prompt({
			message: scriptMessage,
			options: scripts.map((script, idx) => ({
				name: formatScriptOption(script, idx),
				value: String(script.id),
			})).concat(includeGoBack ? [goBackOption] : []),
		});

		if (includeGoBack && isGoBack(selectedScriptId)) {
			continue;
		}

		return scriptsById.get(selectedScriptId) ?? null;
	}
}

async function listScriptsBySource(
	client: Webdock,
	source: InteractiveScriptSource,
): Promise<InteractiveScript[]> {
	const response = source === "ACCOUNT" ? await client.account.scripts.list() : await client.webdock.scripts.list();

	if (!response.success) {
		console.error(colors.red(response.error));
		return [];
	}

	return response.response.body.map((script) => ({
		id: script.id,
		slug: script.slug,
		name: script.name,
		description: script.description ?? "",
		source,
	}));
}

function formatScriptOption(script: InteractiveScript, index: number) {
	const prefix = script.source === "ACCOUNT" ? "Account" : "Library";
	const description = script.description.length > 0 ? ` - ${script.description.slice(0, 48)}` : "";

	return `(${String(index + 1).padStart(3, "0")}) [${prefix}] ${script.name} - #${script.slug}${description}`;
}
