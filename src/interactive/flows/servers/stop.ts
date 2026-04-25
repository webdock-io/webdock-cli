import { Confirm } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { navigator } from "../../navigator.ts";

export async function stopServer(slug: string) {
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	const spinner = new Spinner();

	const confirm = await Confirm.prompt({
		message: "⚠️  Are you sure you want to STOP this server?",
		hint: "This will interrupt all running services",
	});

	if (!confirm) {
		return navigator.goToServerActions(slug);
	}

	spinner.message = "🛑 Initiating shutdown sequence...";
	spinner.start();

	const response = await client.servers.stop({
		serverSlug: slug,
	});
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("❌ Error: Server not found");
				break;
			case 409:
				console.error("❌ Server already stopped");
				break;
			default:
				console.error("❌ Shutdown failed:", response.error);
		}
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("✅ Server stopped successfully!");
	return navigator.goToServerActions(slug);
}
