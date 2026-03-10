import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Confirm } from "@cliffy/prompt";
import { navigator } from "../../navigator.ts";

export async function startServerAction(slug: string) {
	const spinner = new Spinner();
	const token = await getToken();
	const client = new Webdock(token);
	const confirm = await Confirm.prompt({
		message: "⚠️  WARNING:are you sure you want to start this server?",
		default: false,
	});

	if (!confirm) {
		console.log("🚫 Server start cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "🚀 Initializing server startup...";
	spinner.start();
	const response = await client.servers.start({
		serverSlug: slug,
	});
	spinner.stop();

	if (!response.success) {
		console.error("❌ Startup command failed:", response.error);
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("✅ Server is fully operational and ready!");
	return navigator.goToServerActions(slug);
}
