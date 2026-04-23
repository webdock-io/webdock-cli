import { Confirm, Input } from "@cliffy/prompt";
import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { navigator } from "../../navigator.ts";

export async function updateServerSettings(slug: string) {
	const token = await getToken();
	const client = new Webdock(token);
	const spinner = new Spinner();

	const webroot = await Input.prompt({
		message: "Enter the new web root path:",
		validate: (value) => value.length > 0 || "Web root is required",
	});

	const updateWebserver = await Confirm.prompt({
		message: "Update the web server configuration too?",
		default: true,
	});

	const updateLetsencrypt = await Confirm.prompt({
		message: "Update Let's Encrypt configuration too?",
		default: true,
	});

	console.log("\nServer settings summary:");
	console.log(`Server: ${slug}`);
	console.log(`Web root: ${webroot}`);
	console.log(`Update web server config: ${updateWebserver ? "Yes" : "No"}`);
	console.log(`Update Let's Encrypt config: ${updateLetsencrypt ? "Yes" : "No"}`);

	const confirm = await Confirm.prompt({
		message: "Apply these server settings?",
		default: false,
	});

	if (!confirm) {
		console.log("Server settings update cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "Updating server settings...";
	spinner.start();
	const response = await client.servers.settings.update({
		serverSlug: slug,
		webroot,
		updateLetsencrypt,
		updateWebserver,
	});
	spinner.stop();

	if (!response.success) {
		console.error("Server settings update failed:", response.error);
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

	console.log("Server settings updated successfully.");
	return navigator.goToServerActions(slug);
}
