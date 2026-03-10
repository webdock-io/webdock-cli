import { Confirm, Select } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import formatHookName from "../../utils/format-hook-name.ts";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../navigator.ts";

export async function hooksListScreen() {
	const token = await getToken();
	const client = new Webdock(token);
	console.log(colors.bold.brightBlue("Fetching webhooks..."));

	const hooks = await client.hooks.list();
	if (!hooks.success) {
		console.error(colors.red("× Failed to fetch webhooks:"), hooks.error);
		return navigator.goToMain();
	}

	if (hooks.response.body.length === 0) {
		console.log(colors.yellow("! No webhooks found"));
		return navigator.goToMain();
	}

	const selectedHook = await Select.prompt({
		message: "Select a webhook:",
		options: hooks.response.body.map((hook) => ({
			value: hook.id,
			name: formatHookName(hook),
			// @ts-expect-error:: addGoToMainMenuToOptions will always be handled directly after the choice
		})).concat(goBackOption),
	});

	if (isGoBack(String(selectedHook))) return navigator.goToMain();

	const action = await Select.prompt({
		message: "Select action:",
		options: [{
			value: "delete",
			name: `${colors.red("Delete")} webhook`,
		}].concat(goBackOption),
	});

	if (isGoBack(action)) return navigator.goToMain();

	if (action === "delete") {
		const confirmDelete = await Confirm.prompt(
			colors.red("⚠ Are you sure you want to delete this webhook?") +
			" This action cannot be undone.",
		);

		if (!confirmDelete) {
			console.log(colors.yellow("! Deletion cancelled"));
			return navigator.goToHooksList();
		}

		console.log(colors.blue("Deleting webhook..."));
		const deleteResult = await client.hooks.deleteById({ id: selectedHook });

		if (!deleteResult.success) {
			console.error(
				colors.red("× Failed to delete webhook:"),
				deleteResult.error,
			);
			return navigator.goToHooksList();
		}

		console.log(colors.green("✓ Webhook deleted successfully"));
		console.log(colors.dim(`Deleted webhook ID: ${selectedHook}`));
	}

	return navigator.goToHooksList();
}
