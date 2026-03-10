import { Select } from "@cliffy/prompt";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";

export async function hooksMenuScreen() {
	const choice = await Select.prompt({
		message: "Choose",
		options: [
			{
				name: "Create a New Hook!",
				value: "NEW",
			},
			{
				name: "List hooks",
				value: "LIST",
			},
		].concat(goBackOption),
	});

	if (isGoBack(choice)) return navigator.goToMain();

	switch (choice) {
		case "NEW":
			await navigator.runCreateHook();
			break;
		case "LIST":
			await navigator.goToHooksList();
			break;
		default:
			break;
	}
}
