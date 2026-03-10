import { Select } from "@cliffy/prompt/select";
import { goBackOption, isGoBack } from "../../../utils/navigation.ts";
import { navigator } from "../../../navigator.ts";

export async function serverScriptsMenuScreen(slug: string) {
	const action = await Select.prompt({
		message: "Choose an action:",
		options: [
			{
				name: `Add One of your Account scripts to the server ${slug}!`,
				value: "CREATE",
			},
			{
				name: "List scripts on Server!",
				value: "LIST",
			},
		].concat(goBackOption),
	});

	if (isGoBack(action)) return navigator.goToServerActions(slug);

	if (action == "CREATE") {
		await navigator.runCreateServerScript(slug);
	}

	if (action == "LIST") {
		await navigator.goToServerScriptsList(slug);
	}
}
