import { Select } from "@cliffy/prompt";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";

export async function keysMenuScreen() {
	const action = await Select.prompt({
		message: "SSH Key Management",
		options: [
			{
				name: "Add New SSH Key",
				value: "CREATE_KEY",
			},
			{
				name: "View Existing Keys",
				value: "LIST_KEYS",
			},
		].concat(goBackOption),
	});

	if (isGoBack(action)) return navigator.goToMain();

	switch (action) {
		case "CREATE_KEY":
			await navigator.runCreateSSHKey();
			break;
		case "LIST_KEYS":
			await navigator.goToKeysList();
			break;
		default:
			break;
	}
}
