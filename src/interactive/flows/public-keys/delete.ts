import { Confirm } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { navigator } from "../../navigator.ts";
import { colors } from "@cliffy/ansi/colors";

export async function deleteSSHKey(id: number) {
	const spinner = new Spinner();
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });

	const confirm = await Confirm.prompt({
		message: "⚠️  PERMANENTLY delete this SSH key?",
		default: false,
	});

	if (!confirm) {
		console.log("🚫 Deletion cancelled");
		return navigator.goToKeysList();
	}

	spinner.message = "🗑️  Deleting SSH key...";
	spinner.start();

	const response = await client.sshkeys.delete({
		id: id,
	});
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("❌ Key not found");
				break;
			case 403:
				console.error("❌ Permission denied");
				break;
			default:
				console.error("❌ Deletion failed:", response.error);
		}
		return navigator.goToKeysList();
	}

	console.log("✅ Successfully deleted SSH key:", colors.green(id.toString()));
	console.log(
		"🌐 Manage keys:",
		colors.underline("https://webdock.io/en/dash/profile"),
	);
	return navigator.goToKeysList();
}
