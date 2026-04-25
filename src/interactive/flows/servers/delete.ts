import { Confirm } from "@cliffy/prompt/confirm";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { navigator } from "../../navigator.ts";

export async function deleteServer(slug: string) {
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	const spinner = new Spinner();

	const confirm = await Confirm.prompt(
		"⚠️ Are you SURE you want to PERMANENTLY DELETE this server? This cannot be undone!",
	);
	if (!confirm) {
		console.log("🚫 Server deletion cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "🗑️  Initiating server deletion...";
	spinner.start();

	const response = await client.servers.delete({ serverSlug: slug });
	spinner.stop();

	if (!response.success) {
		if (response.code === 404) {
			console.error("❌ Error: Server not found (404)");
		} else console.error(`❌ Deletion failed: ${response.error}`);
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("✅ Server successfully deleted!");
	return navigator.goToMain();
}
