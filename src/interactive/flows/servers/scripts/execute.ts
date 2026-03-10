import { colors } from "@cliffy/ansi/colors";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../../config.ts";
import { FunFact } from "../../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { Confirm } from "@cliffy/prompt/confirm";
import { navigator } from "../../../navigator.ts";

export async function executeScriptOnServer(
	serverSlug: string,
	scriptID: number,
) {
	const token = await getToken();
	const client = new Webdock(token);
	const confirmed = await Confirm.prompt({
		message: `Are you sure you want to execute script #${scriptID} on server ${serverSlug}?`,
		default: false,
	});
	if (!confirmed) {
		return navigator.goToServerScripts(serverSlug);
	}

	const spinner = new Spinner();
	spinner.message = "Initiating server execution";
	spinner.start();
	const response = await client.scripts.executeOnServer({
		scriptID: scriptID,
		serverSlug: serverSlug,
	});
	spinner.stop();

	if (!response.success) {
		console.error(response.error);
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log(colors.bgGreen("script Executed successfully"));
	return navigator.goToServerScripts(serverSlug);
}
