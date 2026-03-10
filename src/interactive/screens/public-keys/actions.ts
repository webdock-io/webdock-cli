import { Select } from "@cliffy/prompt/select";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";

export async function keyActionsScreen(id: number) {
	const action = await Select.prompt({
		message: "Please choose an action: (Some operations cannot be undone)",
		options: [
			{
				value: "DELETE",
				name: "❌Delete Key",
			},
		].concat(goBackOption),
	});

	if (isGoBack(action)) return navigator.goToKeysList();

	switch (action) {
		case "DELETE":
			await navigator.runDeleteSSHKey(id);
			break;
	}
}
