import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Select } from "@cliffy/prompt/select";
import { navigator } from "../../navigator.ts";
import { Confirm } from "@cliffy/prompt";

export async function archive(slug: string) {
	const spinner = new Spinner();
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	const confirm = await Confirm.prompt({
		message: "Confirm Server Archiving:",
	});

	if (!confirm) {
		console.log("🚫 Server Archiving cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "⏳ Archiving server...";
	spinner.start();

	const response = await client.servers.archive({
		serverSlug: slug,
	});
	spinner.stop();

	if (!response.success) {
		console.error("❌ Archiving failed:", response.error);
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("\n✅ Server Archived successfully!");
	return navigator.goToServerList();
}
