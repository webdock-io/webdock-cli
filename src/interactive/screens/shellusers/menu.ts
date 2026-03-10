import { Select } from "@cliffy/prompt";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";

export async function shellUsersMenuScreen(slug: string) {
	const action = await Select.prompt({
		message: "Select an action",
		options: [
			{ name: "Create a new shell user", value: "create" },
			{ name: "List shell users", value: "list" },
		].concat(goBackOption),
	});

	if (isGoBack(action)) return navigator.goToServerActions(slug);

	if (action === "create") await navigator.runCreateShellUser(slug);
	if (action === "list") await navigator.goToShellUsers(slug);
}
