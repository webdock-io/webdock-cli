import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../../config.ts";
import { Select } from "@cliffy/prompt";
import { goBackOption, isGoBack } from "../../../utils/navigation.ts";
import { navigator } from "../../../navigator.ts";

export async function serverScriptsActionsScreen(serverSlug: string) {
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	const response = await client.servers.scripts.listOnServer({
		serverSlug: serverSlug,
	});

	if (!response.success) {
		console.error(response.error);
		return navigator.goToServerScripts(serverSlug);
	}

	if (!response.response.body || response.response.body.length == 0) {
		console.log("\n📭 No scripts available. Create one first!\n");
		return navigator.goToServerScripts(serverSlug);
	}

	const maxLength = Math.max(...response.response.body.map((e) => e.name.length));
	const choice = await Select.prompt({
		message: "Select a script:",
		options: response.response.body
			.map((script) => {
				return {
					name: `(${script.id}) - ${script.name.padEnd(maxLength)}`,
					value: script.id,
				};
			})
			// @ts-expect-error::
			.concat(goBackOption),
	});
	if (isGoBack(String(choice))) return navigator.goToServerScripts(serverSlug);

	const action = await Select.prompt({
		message: "Please choose an action: (Some operations cannot be undone)",
		options: [
			{
				value: "DELETE",
				name: "Delete script",
			},
			{
				value: "EXECUTE",
				name: "Execute script",
			},
		].concat(goBackOption),
	});

	if (isGoBack(action)) return navigator.goToServerScripts(serverSlug);

	if (action == "DELETE") {
		await navigator.runDeleteServerScript(serverSlug, choice);
	}
	if (action == "EXECUTE") {
		await navigator.runExecuteServerScript(serverSlug, choice);
	}
}
