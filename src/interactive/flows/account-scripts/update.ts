import { Confirm, Input } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { Table } from "@cliffy/table";
import { multiLineInput } from "../../utils/multiline.ts";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../navigator.ts";

export async function updateScript(id: number) {
	console.log("🚀 Starting script update process...\n");
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	const script = await client.account.scripts.getById({ scriptId: id });
	if (!script.success) {
		return navigator.goToScriptsList();
	}

	const name = await Input.prompt({
		message: "Enter new script name:",
		validate: (val) => val.length >= 5 || "Name must be at least 5 characters",
		default: script.response.body.name,
	});

	const filename = await Input.prompt({
		message: "Enter new filename:",
		validate: (val) => val.length >= 5 || "Filename must be at least 5 characters",
		default: script.response.body.filename,
	});

	const content = await multiLineInput(script.response.body.content);
	if (!content) {
		console.log(
			`❌${colors.bgRed(`Empty content detected. Canceling the operation.`)}`,
		);
		return navigator.goToScriptsList();
	}

	console.log("\n📝 Update Summary:");
	new Table()
		.border()
		.header(["Field", "Value"])
		.body([
			["ID", script.response.body.id],
			["Name", name],
			["Filename", filename],
		])
		.render();

	const confirmed = await Confirm.prompt({
		message: "Confirm these changes?",
		default: false,
	});

	if (!confirmed) {
		console.log("\n❌ Update cancelled");
		return navigator.goToScriptsList();
	}

	console.log("\n🔄 Submitting update to Webdock...");

	const response = await client.account.scripts.update({
		id,
		name,
		filename,
		content,
	});

	if (!response.success) {
		console.error("\n❌ Update failed:", response.error || "Unknown error");
		if (response.code === 404) {
			console.error("💡 Hint: Check if the script ID exists");
		}
		if (response.code === 400) {
			console.error("💡 Hint: Validate your input format");
		}
		return navigator.goToScriptsList();
	}

	console.log("\n🎉 Script updated successfully!");

	new Table()
		.border()
		.header(["Field", "Updated Value"])
		.body([
			["ID", response.response.body.id],
			["Name", response.response.body.name],
			["Filename", response.response.body.filename],
			["Last Updated", new Date().toLocaleString()],
			["Content Preview", response.response.body.content.slice(0, 25) + "..."],
		])
		.render();

	return navigator.goToScriptsList();
}
