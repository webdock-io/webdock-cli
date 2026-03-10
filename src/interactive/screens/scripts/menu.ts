import { Select } from "@cliffy/prompt";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";

export async function scriptsMenuScreen() {
	const choice = await Select.prompt({
		message: "What do you want to do?",
		options: [
			{
				name: "New Script",
				value: "CREATE",
			},
			{
				name: "List Scripts",
				value: "LIST",
			},
		].concat(goBackOption),
	});

	if (isGoBack(choice)) return navigator.goToMain();

	switch (choice) {
		case "CREATE":
			await navigator.runCreateScript();
			break;
		case "LIST":
			await navigator.goToScriptsList();
			break;
		default:
			break;
	}
}
