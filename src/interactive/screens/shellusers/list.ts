import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { navigator } from "../../navigator.ts";

export async function shellUsersListScreen(slug: string) {
	const spinner = new Spinner();
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });

	spinner.message = "🔍 Loading shell users...";
	spinner.start();
	const response = await client.shellUsers.list({ serverSlug: slug });
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("❌ Server not found");
				break;
			case 403:
				console.error("❌ Permission denied");
				break;
			default:
				console.error("❌ Failed to fetch users:", response.error);
		}
		return navigator.goToServerActions(slug);
	}

	if (!response.response.body || response.response.body.length === 0) {
		console.log("ℹ️  No shell users found for this server");
		return navigator.goToServerActions(slug);
	}

	console.log(colors.bgBlue.white(` SHELL USERS (${slug.toUpperCase()}) `));

	const selectedUser = await Select.prompt({
		message: "Select a user:",
		options: response.response.body
			.map((user) => ({
				name: [
					`${colors.yellow(user.username.padEnd(15))}`,
					`${user.group}`,
					`${user.shell.padEnd(10)}`,
					`${new Date(user.created).toLocaleDateString()}`,
				].join(" | "),
				value: user.id,
			}))
			// @ts-expect-error:
			.concat(goBackOption),
	});

	if (isGoBack(String(selectedUser))) return navigator.goToServerActions(slug);

	const action = await Select.prompt({
		message: "Select a action:",
		options: [
			{
				name: "Delete Shell User",
				value: "delete",
			},
			{
				name: "Edit Shell User",
				value: "edit",
			},
		].concat(goBackOption),
	});

	if (isGoBack(action)) return navigator.goToServerActions(slug);

	if (action == "delete") {
		await navigator.runDeleteShellUser(slug, selectedUser);
	}
	if (action == "edit") {
		await navigator.runUpdateShellUser(slug, selectedUser);
	}
}
