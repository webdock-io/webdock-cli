import { Confirm, Input, Select } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { multiLineInput } from "../../utils/multiline.ts";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../navigator.ts";
import { PathPicker } from "../../utils/path-picker.ts";

export async function createScript() {
	console.log("🚀 Starting script creation process...\n");
	const token = await getToken();
	const client = new Webdock(token);

	const name = await Input.prompt({
		message: "What name would you like to give your script?",
		validate: (val) => val.length >= 5 || "Script name must be at least 5 characters",
	});

	const filename = await Input.prompt({
		message: "What filename should we use to save the script?",
		validate: (val) => val.length >= 5 || "Filename must be at least 5 characters",
	});

	let script = "";
	const keyPathPickMethod = await Select.prompt({
		message: "How would you like to provide your key?",
		options: [
			{
				name: "Select a file from your drive",
				value: "PICK",
			},
			{
				name: "Enter the script manually",
				value: "WRITE",
			},
		],
	});
	if (keyPathPickMethod == "PICK") {
		const path = await new PathPicker().pickFile();
		script = await Deno.readTextFile(path);
	} else {
		script = await multiLineInput();
	}

	const confirmed = await Confirm.prompt({
		message: `Are you sure you want to create script ?`,
		default: false,
	});

	if (!confirmed) {
		console.log("\n❌ Creating cancelled by user");
		return navigator.goToScriptsList();
	}

	console.log("\n🔄 Submitting script to Webdock API...");

	const response = await client.account.scripts.create(
		{ name, filename, content: script },
	);

	if (!response.success) {
		console.error(
			"\n❌ Script creation failed:",
			response.error || "Unknown error",
		);
		return navigator.goToScriptsList();
	}

	console.log("\n🎉 Script created successfully!");
	console.log(`🔑 Script ID: ${response.response.body.id}`);
	return navigator.goToScriptsList();
}
