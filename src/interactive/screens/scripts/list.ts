import { colors } from "@cliffy/ansi/colors";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { Select } from "@cliffy/prompt";
import { navigator } from "../../navigator.ts";

export async function scriptsListScreen() {
	const token = await getToken();
	const client = new Webdock(token);
	const response = await client.scripts.list();
	if (!response.success) {
		console.error(response.error);
		return navigator.goToMain();
	}
	if (response.response.body.length == 0) {
		console.log(colors.bgRed("No Scripts were found!"));
		return navigator.goToMain();
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
			// @ts-expect-error:
			.concat(goBackOption),
	});

	if (isGoBack(String(choice))) return navigator.goToMain();

	await navigator.goToScriptActions(choice);
}
