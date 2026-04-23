import { Confirm } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { navigator } from "../../navigator.ts";

export async function uncancelServerDelete(slug: string) {
	const confirm = await Confirm.prompt({
		message: "Cancel the scheduled deletion for this server?",
		default: true,
	});

	if (!confirm) {
		console.log("Scheduled deletion was left unchanged.");
		return navigator.goToServerActions(slug);
	}

	const token = await getToken();
	const client = new Webdock(token);
	const response = await client.servers.cancelDelete({
		serverSlug: slug,
	});

	if (!response.success) {
		console.error("Failed to cancel scheduled deletion:", response.error);
		return navigator.goToServerActions(slug);
	}

	console.log("Scheduled deletion cancelled.");
	return navigator.goToServerActions(slug);
}
