import { Confirm } from "@cliffy/prompt/confirm";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../../config.ts";
import { navigator } from "../../../navigator.ts";

export async function deleteServerScript(
	serverSlug: string,
	scriptId: number,
) {
	const token = await getToken();
	const client = new Webdock(token);
	console.log("🚀 Starting script deletion process...\n");

	const confirmed = await Confirm.prompt({
		message: `Are you sure you want to delete script #${scriptId}?`,
		default: false,
	});

	if (!confirmed) {
		console.log("\n❌ Deletion cancelled by user");
		return navigator.goToServerScripts(serverSlug);
	}

	console.log("\n🔄 Deleting script from Webdock...");

	const response = await client.servers.scripts.delete({
		scriptId: scriptId,
		serverSlug: serverSlug,
	});

	if (!response.success) {
		console.error(
			"\n❌ Script deletion failed:",
			response.error || "Unknown error",
		);
		Deno.exit(1);
	}

	console.log("\n🎉 Script deleted successfully!");
	console.log(`🗑️ Deleted script ID: ${scriptId}`);
	return navigator.goToServerScripts(serverSlug);
}
