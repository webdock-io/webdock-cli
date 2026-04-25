import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Confirm } from "@cliffy/prompt/confirm";
import { navigator } from "../../navigator.ts";

export async function reboot(slug: string) {
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	const spinner = new Spinner();
	const confirm = await Confirm.prompt(
		"⚠️ Are you SURE you want to reboot this server?!",
	);
	if (!confirm) {
		console.log("🚫 Server reboot cancelled");
		return navigator.goToServerActions(slug);
	}
	spinner.message = "🔄 Initiating server reboot...";
	spinner.start();

	const response = await client.servers.reboot({ serverSlug: slug });

	if (!response.success) {
		spinner.stop();
		console.error("❌ Failed to initiate reboot:", response.error);
		return navigator.goToServerActions(slug);
	}

	spinner.stop();

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("✅ Server reboot completed successfully!");
	return navigator.goToServerActions(slug);
}
