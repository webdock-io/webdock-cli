import { Confirm, Input } from "@cliffy/prompt";
import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { navigator } from "../../navigator.ts";

export async function updateServerIdentity(slug: string) {
	const token = await getToken();
	const client = new Webdock(token);
	const spinner = new Spinner();

	const maindomain = await Input.prompt({
		message: "Enter the main domain:",
		validate: (value) => value.length > 0 || "Main domain is required",
	});

	const aliasdomains = await Input.prompt({
		message: "Enter alias domains (comma separated, optional):",
		default: "",
	});

	const removeDefaultAlias = await Confirm.prompt({
		message: "Remove the default Webdock alias from DNS?",
		default: true,
	});

	console.log("\nIdentity update summary:");
	console.log(`Server: ${slug}`);
	console.log(`Main domain: ${maindomain}`);
	if (aliasdomains.trim().length > 0) {
		console.log(`Alias domains: ${aliasdomains}`);
	}
	console.log(`Remove default alias: ${removeDefaultAlias ? "Yes" : "No"}`);

	const confirm = await Confirm.prompt({
		message: "Apply these identity changes?",
		default: false,
	});

	if (!confirm) {
		console.log("Server identity update cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "Updating server identity...";
	spinner.start();
	const response = await client.servers.identity.update({
		serverSlug: slug,
		maindomain,
		...(aliasdomains.trim().length > 0 ? { aliasdomains } : {}),
		removeDefaultAlias,
	});
	spinner.stop();

	if (!response.success) {
		console.error("Identity update failed:", response.error);
		return navigator.goToServerActions(slug);
	}

	spinner.message = "Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();

	if (!waitResult.success) {
		console.error(waitResult.error);
		return navigator.goToMain();
	}

	console.log("Server identity updated successfully.");
	return navigator.goToServerActions(slug);
}
