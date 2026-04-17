import { Confirm, Input, List, Select } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { multiLineInput } from "../../utils/multiline.ts";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../navigator.ts";
import { PathPicker } from "../../utils/path-picker.ts";

export async function createSSHKey() {
	const token = await getToken();
	const client = new Webdock(token);

	const name = await Input.prompt({
		message: "🔑 Enter key name:",
		validate: (input) => input.length > 2 || "Name must be at least 3 characters",
	});

	let publicKey = "";
	const keyPathPickMethod = await Select.prompt({
		message: "How would you like to provide your key?",
		options: [
			{
				name: "Select a file from your drive",
				value: "PICK",
			},
			{
				name: "Enter the key manually",
				value: "WRITE",
			},
		],
	});
	if (keyPathPickMethod == "PICK") {
		const path = await new PathPicker().pickFile();
		publicKey = await Deno.readTextFile(path);
	} else {
		publicKey = await multiLineInput();
	}

	if (!publicKey) {
		console.log(
			`❌${colors.bgRed(`Empty key detected. Canceling the operation.`)}`,
		);
		return navigator.goToKeysList();
	}

	const confirm = await Confirm.prompt({
		message: "Create this SSH key?",
		default: false,
	});

	if (!confirm) {
		console.log("🚫 Key creation cancelled");
		return navigator.goToKeysList();
	}

	const spinner = new Spinner({ message: "🔨 Creating SSH key..." });
	const response = await client.sshkeys.create({ name, publicKey });
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 409:
				console.error("❌ Key name already exists");
				break;
			case 400:
				console.error("❌ Invalid key format");
				break;
			default:
				console.error("❌ Creation failed:", response.error);
		}
		return navigator.goToKeysList();
	}

	console.log("\n✅ SSH Key created successfully!");
	console.log("📛 Name:", response.response.body.name);
	console.log("🆔 ID:", response.response.body.id);
	return navigator.goToKeysList();
}
