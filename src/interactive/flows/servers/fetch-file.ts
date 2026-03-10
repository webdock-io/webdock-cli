import { Input } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { sanitizePath } from "../../../utils/sanitize-path.ts";
import { navigator } from "../../navigator.ts";

export async function fetchFile(slug: string) {
	const token = await getToken();
	const client = new Webdock(token);

	const spinner = new Spinner();

	const path = await Input.prompt({
		message: "📁 Enter file path to retrieve:",
		validate: (val) => val.startsWith("/") ? true : "Path should be absolute",
	});

	const sanitizedPath = await sanitizePath(path);
	if (!sanitizedPath) return;

	spinner.message = "🔍 Searching for file...";
	spinner.start();

	const response = await client.servers.fetchFileAsync({
		path: sanitizedPath,
		slug: slug,
	});
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 400:
				console.error("❌ Invalid request:", response.error);
				break;
			case 404:
				console.error("❌ Server or file not found");
				break;
			default:
				console.error("❌ File retrieval failed:", response.error);
		}
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("\n✅ File successfully retrieved!");
	return navigator.goToServerActions(slug);
}
