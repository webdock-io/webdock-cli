import { Confirm } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { navigator } from "../../navigator.ts";

export async function deleteScript(scriptId: number) {
	console.log("🚀 Starting script deletion process...\n");
	const token = await getToken();
	const client = new Webdock(token);

	const confirmed = await Confirm.prompt({
		message: `Are you sure you want to delete script #${scriptId}?`,
		default: false,
	});

	if (!confirmed) {
		console.log("\n❌ Deletion cancelled by user");
		return navigator.goToScriptsList();
	}

	console.log("\n🔄 Deleting script from Webdock...");

	const response = await client.account.scripts.delete(
		{
			id: scriptId,
		},
	);

	if (!response.success) {
		console.error(
			"\n❌ Script deletion failed:",
			response.error || "Unknown error",
		);
		return navigator.goToScriptsList();
	}

	console.log("\n🎉 Script deleted successfully!");
	console.log(`🗑️ Deleted script ID: ${scriptId}`);
	return navigator.goToScriptsList();
}
