import { Select } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { navigator } from "../../navigator.ts";

export async function keysListScreen() {
	const spinner = new Spinner();
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });

	spinner.message = "🔑 Loading SSH keys...";
	spinner.start();

	const response = await client.sshkeys.list();
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("❌ Resource not found");
				break;
			case 429:
				console.error("❌ Too many requests - try again later");
				break;
			default:
				console.error("❌ Failed to fetch keys:", response.error);
		}
		return navigator.goToMain();
	}

	if (response.response.body.length === 0) {
		console.log("No SSH keys found!");
		return navigator.goToMain();
	}

	const key = await Select.prompt({
		message: "Select key!",
		options: response.response.body
			.map((key) => {
				return {
					name: `${key.name} (#${key.id})`,
					value: key.id,
				};
			})
			// @ts-expect-error::
			.concat(goBackOption),
	});
	if (isGoBack(String(key))) return navigator.goToMain();

	await navigator.goToKeyActions(key);
}
