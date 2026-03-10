import { Select } from "@cliffy/prompt/select";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";

export async function scriptActionsScreen(id: number) {
	const action = await Select.prompt({
		message: "Please choose an action: (Some operations cannot be undone)",
		options: [
			{
				value: "DELETE",
				name: `Delete script #${id}`,
			},
			{
				value: "UPDATE",
				name: `Update script #${id}`,
			},
		].concat(goBackOption),
	});

	if (isGoBack(action)) return navigator.goToScriptsList();

	switch (action) {
		case "DELETE":
			await navigator.runDeleteScript(id);
			break;
		case "UPDATE":
			await navigator.runUpdateScript(id);
			break;
	}
}
