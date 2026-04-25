import { Checkbox, Confirm } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../../config.ts";
import { FunFact } from "../../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../../navigator.ts";

export async function updateShellUserKeys(
	{ serverSlug, shellUserId }: {
		serverSlug: string;
		shellUserId: number;
	},
) {
	const spinner = new Spinner();
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });

	spinner.message = "🔑 Loading available keys...";
	spinner.start();
	const keys = await client.sshkeys.list();
	spinner.stop();

	if (!keys.success) {
		switch (keys.code) {
			case 404:
				console.error("❌ Resource not found");
				break;
			case 429:
				console.error("❌ Too many requests - try again later");
				break;
			default:
				console.error("❌ Failed to fetch keys:", keys.error);
		}
		return navigator.goToMain();
	}

	let selected_keys;
	if (keys.success && keys.response.body.length > 0) {
		selected_keys = await Checkbox.prompt({
			message: "select keys! (Hit Enter twice to skip)",
			options: keys.response.body.map((e) => {
				return {
					value: e.id,
					name: `${e.name} (${e.id})`,
				};
			}),
		});
	} else {
		console.log("No ssh keys were found, create one first");
		return navigator.goToShellUsers(serverSlug);
	}

	const confirm = await Confirm.prompt({
		message: "Update SSH keys for this user?",
		default: false,
	});

	if (!confirm) {
		console.log("🚫 Update cancelled");
		return navigator.goToShellUsers(serverSlug);
	}

	spinner.message = "🔄 Updating SSH keys...";

	const response = await client.shellUsers.edit({
		id: shellUserId,
		keys: selected_keys ?? [],
		slug: serverSlug,
	});
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("❌ User or server not found");
				break;
			case 403:
				console.error("❌ Permission denied");
				break;
			default:
				console.error("❌ Key update failed:", response.error);
		}
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log(colors.green("\n✅ SSH keys updated successfully!"));
	return navigator.goToShellUsers(serverSlug);
}
